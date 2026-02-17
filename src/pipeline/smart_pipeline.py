"""
Smart Pipeline - Auto-Detection for Train vs Predict

Automatically determines whether to:
1. Train a new model (new domain/dataset)
2. Use existing model (compatible dataset)
3. Retrain (dataset has changed significantly)
"""

import os
import json
import hashlib
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import joblib

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.schema_config import ColumnType
from mappers.column_mapper import ColumnMapper, MappingResult
from validators.schema_validator import SchemaValidator
from pipeline.preprocessor import AdaptivePreprocessor
from pipeline.model_pipeline import ModelPipeline
from recommender.recommender import RecommendationEngine

# Try LLM
try:
    from llm.llm_engine import get_llm_engine
    HAS_LLM = True
except ImportError:
    HAS_LLM = False


@dataclass
class DomainSignature:
    """Unique signature of a dataset/domain"""
    domain_name: str
    column_hash: str
    target_column: str
    n_features: int
    key_columns: List[str]
    created_at: str


@dataclass
class AutoDecision:
    """Decision from auto-detection"""
    action: str  # "train", "predict", "retrain"
    reason: str
    model_path: Optional[str] = None
    confidence: float = 0.0
    domain_match: Optional[str] = None


class SmartPipeline:
    """
    Intelligent pipeline that auto-detects whether to train or predict.
    
    How it works:
    1. Analyzes uploaded dataset structure
    2. Compares with existing trained models
    3. Decides: Train new model OR use existing
    4. Runs appropriate pipeline
    """
    
    MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    REGISTRY_FILE = os.path.join(MODELS_DIR, "model_registry.json")
    
    def __init__(self):
        self.mapper = ColumnMapper()
        self.llm_engine = get_llm_engine() if HAS_LLM else None
        self._load_registry()
    
    def _load_registry(self):
        """Load registry of trained models"""
        if os.path.exists(self.REGISTRY_FILE):
            with open(self.REGISTRY_FILE, 'r') as f:
                self.registry = json.load(f)
        else:
            self.registry = {"models": {}}
    
    def _save_registry(self):
        """Save registry to disk"""
        os.makedirs(self.MODELS_DIR, exist_ok=True)
        with open(self.REGISTRY_FILE, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def _compute_column_hash(self, columns: List[str]) -> str:
        """Create hash of column names for matching"""
        sorted_cols = sorted([c.lower().strip() for c in columns])
        return hashlib.md5("_".join(sorted_cols).encode()).hexdigest()[:12]
    
    def _detect_domain(self, df: pd.DataFrame, mapping: MappingResult) -> str:
        """Detect domain using LLM or heuristics"""
        if self.llm_engine and self.llm_engine.available:
            sample_values = {col: df[col].dropna().head(2).tolist() for col in df.columns[:8]}
            domain = self.llm_engine.detect_domain(list(df.columns), sample_values)
            if domain:
                return domain
        
        # Fallback: heuristic detection
        columns_lower = " ".join(df.columns).lower()
        if any(x in columns_lower for x in ["phone", "internet", "streaming", "fiber"]):
            return "Telecom"
        elif any(x in columns_lower for x in ["credit", "balance", "loan", "deposit"]):
            return "Banking"
        elif any(x in columns_lower for x in ["employee", "department", "salary", "job"]):
            return "HR/Employee"
        elif any(x in columns_lower for x in ["subscription", "plan", "usage"]):
            return "SaaS/Subscription"
        else:
            return "General"
    
    def _calculate_compatibility(
        self, 
        df: pd.DataFrame, 
        mapping: MappingResult,
        registered_model: Dict
    ) -> float:
        """Calculate how compatible a dataset is with an existing model"""
        score = 0.0
        
        # Check column overlap
        current_cols = set(df.columns)
        model_cols = set(registered_model.get("columns", []))
        
        if not model_cols:
            return 0.0
        
        overlap = len(current_cols & model_cols) / len(model_cols)
        score += overlap * 0.5  # 50% weight
        
        # Check target column match
        current_target = None
        for col, m in mapping.mappings.items():
            if m.target_type == ColumnType.TARGET:
                current_target = col
                break
        
        if current_target and current_target.lower() == registered_model.get("target", "").lower():
            score += 0.3  # 30% weight for target match
        
        # Check feature count similarity
        current_features = len(df.columns)
        model_features = registered_model.get("n_features", 0)
        if model_features > 0:
            feature_ratio = min(current_features, model_features) / max(current_features, model_features)
            score += feature_ratio * 0.2  # 20% weight
        
        return score
    
    def analyze(self, df: pd.DataFrame) -> AutoDecision:
        """
        Analyze dataset and decide whether to train or predict.
        
        Returns:
            AutoDecision with recommended action
        """
        print("\n🔍 Analyzing dataset...")
        
        # Step 1: Map columns
        mapping = self.mapper.map_columns(df)
        
        # Step 2: Find target column
        target_col = None
        for col, m in mapping.mappings.items():
            if m.target_type == ColumnType.TARGET:
                target_col = col
                break
        
        if not target_col:
            return AutoDecision(
                action="train",
                reason="No existing model found and target column detected. Training new model.",
                confidence=0.8
            )
        
        # Step 3: Detect domain
        domain = self._detect_domain(df, mapping)
        print(f"   Detected domain: {domain}")
        
        # Step 4: Check for compatible existing models
        best_match = None
        best_score = 0.0
        
        for model_id, model_info in self.registry.get("models", {}).items():
            score = self._calculate_compatibility(df, mapping, model_info)
            if score > best_score:
                best_score = score
                best_match = model_id
        
        print(f"   Best model match: {best_match} (score: {best_score:.1%})")
        
        # Step 5: Make decision
        if best_score >= 0.7:
            # High compatibility - use existing model
            model_path = self.registry["models"][best_match].get("model_path")
            return AutoDecision(
                action="predict",
                reason=f"Found compatible model '{best_match}' with {best_score:.0%} similarity. Using existing model.",
                model_path=model_path,
                confidence=best_score,
                domain_match=best_match
            )
        elif best_score >= 0.4:
            # Medium compatibility - suggest retrain
            return AutoDecision(
                action="retrain",
                reason=f"Partial match with '{best_match}' ({best_score:.0%}). Recommend training new model for better accuracy.",
                confidence=best_score,
                domain_match=best_match
            )
        else:
            # No good match - must train
            return AutoDecision(
                action="train",
                reason=f"New domain '{domain}' detected. No compatible model found. Training new model.",
                confidence=0.9
            )
    
    def run(
        self, 
        df: pd.DataFrame, 
        output_path: Optional[str] = None,
        force_train: bool = False,
        force_predict: bool = False
    ) -> Dict[str, Any]:
        """
        Run the smart pipeline - auto-detects train vs predict.
        
        Args:
            df: Input DataFrame
            output_path: Path for predictions output
            force_train: Force training even if model exists
            force_predict: Force prediction using existing model
            
        Returns:
            Results dictionary
        """
        print("\n" + "=" * 60)
        print("🧠 SMART CHURN PREDICTION PIPELINE")
        print("=" * 60)
        print(f"\n📊 Dataset: {len(df)} rows, {len(df.columns)} columns")
        
        # Analyze the dataset
        decision = self.analyze(df)
        
        print(f"\n📋 Decision: {decision.action.upper()}")
        print(f"   Reason: {decision.reason}")
        
        # Override if forced
        if force_train:
            decision.action = "train"
        elif force_predict and decision.model_path:
            decision.action = "predict"
        
        # Execute the decision
        if decision.action in ["train", "retrain"]:
            return self._run_training(df, decision)
        else:
            return self._run_prediction(df, decision, output_path)
    
    def _run_training(self, df: pd.DataFrame, decision: AutoDecision) -> Dict[str, Any]:
        """Execute training pipeline"""
        print("\n🚀 Starting model training...")
        
        # Map columns
        mapping = self.mapper.map_columns(df)
        
        # Get domain name
        domain = self._detect_domain(df, mapping)
        safe_domain = domain.lower().replace("/", "_").replace(" ", "_")
        
        # Define paths
        model_path = os.path.join(self.MODELS_DIR, f"{safe_domain}_model.pkl")
        preprocessor_path = os.path.join(self.MODELS_DIR, f"{safe_domain}_preprocessor.pkl")
        
        # Train
        pipeline = ModelPipeline(model_type="random_forest", column_mapper=self.mapper)
        result = pipeline.train(df, mapping)
        
        # Save
        os.makedirs(self.MODELS_DIR, exist_ok=True)
        pipeline.save(model_path, preprocessor_path)
        
        # Find target column
        target_col = None
        for col, m in mapping.mappings.items():
            if m.target_type == ColumnType.TARGET:
                target_col = col
                break
        
        # Register the model
        self.registry["models"][domain] = {
            "model_path": model_path,
            "preprocessor_path": preprocessor_path,
            "columns": list(df.columns),
            "target": target_col,
            "n_features": len(df.columns),
            "n_samples": len(df),
            "created_at": pd.Timestamp.now().isoformat()
        }
        self._save_registry()
        
        print(pipeline.get_training_report())
        print(f"\n💾 Model saved: {model_path}")
        print(f"📝 Registered as: {domain}")
        
        return {
            "action": "trained",
            "domain": domain,
            "model_path": model_path,
            "metrics": result
        }
    
    def _run_prediction(
        self, 
        df: pd.DataFrame, 
        decision: AutoDecision,
        output_path: Optional[str]
    ) -> Dict[str, Any]:
        """Execute prediction pipeline"""
        print(f"\n🔮 Loading model: {decision.model_path}")
        
        # Get preprocessor path
        model_info = self.registry["models"].get(decision.domain_match, {})
        preprocessor_path = model_info.get("preprocessor_path")
        
        # Load model
        pipeline = ModelPipeline.load(decision.model_path, preprocessor_path)
        
        # Predict
        print("🎯 Making predictions...")
        pred_result = pipeline.predict(df)
        
        # Generate recommendations
        print("💡 Generating recommendations...")
        rec_engine = RecommendationEngine(pipeline.mapping_result, use_llm=True)
        rec_engine.fit(df, pipeline.mapping_result)
        
        recommendations = rec_engine.recommend_batch(
            df,
            churn_probabilities=pred_result.probabilities,
            churn_predictions=pred_result.prediction_labels
        )
        
        # Build output
        output_df = df.copy()
        output_df["Churn_Probability"] = pred_result.probabilities
        output_df["Churn_Prediction"] = pred_result.prediction_labels
        
        rec_df = rec_engine.to_dataframe(recommendations)
        output_df["Risk_Level"] = rec_df["risk_level"]
        output_df["Recommendations"] = rec_df["recommendations"]
        
        # Save if path provided
        if output_path:
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            output_df.to_csv(output_path, index=False)
            print(f"\n💾 Predictions saved: {output_path}")
        
        # Print summary
        stats = rec_engine.get_summary_statistics(recommendations)
        print("\n📊 Summary:")
        print(f"   Total: {stats['total_customers']}")
        print(f"   High Risk: {stats['high_risk_count']}")
        print(f"   Avg Churn Probability: {stats['avg_churn_probability']:.1%}")
        
        # AI report if available
        ai_report = rec_engine.get_ai_enhanced_report(df, recommendations)
        if ai_report:
            print("\n" + ai_report)
        
        return {
            "action": "predicted",
            "model_used": decision.domain_match,
            "total_predictions": len(df),
            "high_risk_count": stats['high_risk_count'],
            "output_path": output_path
        }


def smart_process(data_path: str, output_path: Optional[str] = None) -> Dict[str, Any]:
    """
    One-line smart processing - auto-detects train vs predict.
    
    Usage:
        result = smart_process("data/raw/customers.csv", "output/predictions.csv")
    """
    df = pd.read_csv(data_path)
    pipeline = SmartPipeline()
    return pipeline.run(df, output_path)
