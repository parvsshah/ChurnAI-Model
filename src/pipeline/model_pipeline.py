"""
Model Pipeline for Adaptive Churn Prediction

Provides training and inference capabilities that work with any dataset
through semantic column mapping.
"""

import pandas as pd
import numpy as np
import joblib
import os
import sys
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix
)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.schema_config import ColumnType
from mappers.column_mapper import ColumnMapper, MappingResult
from pipeline.preprocessor import AdaptivePreprocessor


@dataclass
class TrainingResult:
    """Result of model training"""
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    cv_scores: List[float] = field(default_factory=list)
    feature_importance: Dict[str, float] = field(default_factory=dict)


@dataclass
class PredictionResult:
    """Result of churn prediction"""
    predictions: np.ndarray
    probabilities: np.ndarray
    prediction_labels: List[str] = field(default_factory=list)


class ModelPipeline:
    """
    End-to-end model pipeline for adaptive churn prediction.
    
    Supports:
    - Multiple model types
    - Automatic preprocessing
    - Column mapping integration
    - Feature importance extraction
    """
    
    AVAILABLE_MODELS = {
        'random_forest': RandomForestClassifier,
        'gradient_boosting': GradientBoostingClassifier,
        'logistic_regression': LogisticRegression
    }
    
    DEFAULT_PARAMS = {
        'random_forest': {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'random_state': 42,
            'n_jobs': -1
        },
        'gradient_boosting': {
            'n_estimators': 100,
            'max_depth': 5,
            'learning_rate': 0.1,
            'random_state': 42
        },
        'logistic_regression': {
            'max_iter': 1000,
            'random_state': 42
        }
    }
    
    def __init__(
        self,
        model_type: str = 'random_forest',
        model_params: Optional[Dict] = None,
        column_mapper: Optional[ColumnMapper] = None
    ):
        """
        Initialize the model pipeline.
        
        Args:
            model_type: One of 'random_forest', 'gradient_boosting', 'logistic_regression'
            model_params: Custom model parameters (optional)
            column_mapper: ColumnMapper for semantic detection
        """
        if model_type not in self.AVAILABLE_MODELS:
            raise ValueError(f"Unknown model type: {model_type}. "
                           f"Available: {list(self.AVAILABLE_MODELS.keys())}")
        
        self.model_type = model_type
        self.model_params = model_params or self.DEFAULT_PARAMS.get(model_type, {})
        self.column_mapper = column_mapper or ColumnMapper()
        
        self.model = None
        self.preprocessor = AdaptivePreprocessor()
        self.mapping_result: Optional[MappingResult] = None
        self.training_result: Optional[TrainingResult] = None
        self._is_trained = False
    
    def train(
        self,
        df: pd.DataFrame,
        mapping_result: Optional[MappingResult] = None,
        test_size: float = 0.2,
        cv_folds: int = 5
    ) -> TrainingResult:
        """
        Train the model on provided data.
        
        Args:
            df: Training DataFrame
            mapping_result: Pre-computed column mappings (auto-detected if None)
            test_size: Fraction for test split
            cv_folds: Number of cross-validation folds
            
        Returns:
            TrainingResult with metrics
        """
        # Get column mappings
        if mapping_result is None:
            mapping_result = self.column_mapper.map_columns(df, mode="auto")
        self.mapping_result = mapping_result
        
        # Build and fit preprocessor
        self.preprocessor.build_pipeline(df, mapping_result)
        X = self.preprocessor.fit_transform(df, mapping_result)
        
        # Get target
        target_col = self.preprocessor.target_column
        if target_col is None:
            raise ValueError("No target column found in mapping")
        
        y = self.preprocessor.transform_target(df[target_col])
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Initialize and train model
        ModelClass = self.AVAILABLE_MODELS[self.model_type]
        self.model = ModelClass(**self.model_params)
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=cv_folds, scoring='roc_auc')
        
        # Feature importance
        feature_importance = self._get_feature_importance()
        
        # Create result
        self.training_result = TrainingResult(
            model_name=self.model_type,
            accuracy=accuracy_score(y_test, y_pred),
            precision=precision_score(y_test, y_pred, zero_division=0),
            recall=recall_score(y_test, y_pred, zero_division=0),
            f1=f1_score(y_test, y_pred, zero_division=0),
            roc_auc=roc_auc_score(y_test, y_prob),
            cv_scores=cv_scores.tolist(),
            feature_importance=feature_importance
        )
        
        self._is_trained = True
        return self.training_result
    
    def predict(
        self,
        df: pd.DataFrame,
        threshold: float = 0.5
    ) -> PredictionResult:
        """
        Make predictions on new data.
        
        Args:
            df: DataFrame for prediction
            threshold: Probability threshold for positive class
            
        Returns:
            PredictionResult with predictions and probabilities
        """
        if not self._is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Transform features
        X = self.preprocessor.transform(df)
        
        # Predict
        probabilities = self.model.predict_proba(X)[:, 1]
        predictions = (probabilities >= threshold).astype(int)
        
        # Convert to labels
        labels = self.preprocessor.inverse_transform_target(predictions)
        
        return PredictionResult(
            predictions=predictions,
            probabilities=probabilities,
            prediction_labels=labels.tolist()
        )
    
    def _get_feature_importance(self) -> Dict[str, float]:
        """Extract feature importance from model"""
        feature_names = self.preprocessor.get_feature_names()
        
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
        elif hasattr(self.model, 'coef_'):
            importances = np.abs(self.model.coef_[0])
        else:
            return {}
        
        # Create dict and sort by importance
        importance_dict = dict(zip(feature_names, importances))
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
    
    def get_training_report(self) -> str:
        """Generate human-readable training report"""
        if self.training_result is None:
            return "No training results available"
        
        r = self.training_result
        lines = [
            "=" * 60,
            "MODEL TRAINING REPORT",
            "=" * 60,
            f"\nModel: {r.model_name}",
            f"\n📊 Performance Metrics:",
            f"  Accuracy:  {r.accuracy:.4f}",
            f"  Precision: {r.precision:.4f}",
            f"  Recall:    {r.recall:.4f}",
            f"  F1 Score:  {r.f1:.4f}",
            f"  ROC-AUC:   {r.roc_auc:.4f}",
            f"\n📈 Cross-Validation (ROC-AUC):",
            f"  Mean: {np.mean(r.cv_scores):.4f} ± {np.std(r.cv_scores):.4f}",
            f"  Scores: {[f'{s:.4f}' for s in r.cv_scores]}",
        ]
        
        if r.feature_importance:
            lines.append("\n🔍 Top 10 Feature Importance:")
            for i, (feat, imp) in enumerate(list(r.feature_importance.items())[:10]):
                lines.append(f"  {i+1}. {feat}: {imp:.4f}")
        
        lines.append("\n" + "=" * 60)
        return "\n".join(lines)
    
    def save(self, model_path: str, preprocessor_path: str):
        """Save model and preprocessor to disk"""
        if not self._is_trained:
            raise ValueError("Model not trained")
        
        # Save model
        model_data = {
            'model': self.model,
            'model_type': self.model_type,
            'model_params': self.model_params,
            'training_result': self.training_result,
            'mapping_result': self.mapping_result
        }
        joblib.dump(model_data, model_path)
        
        # Save preprocessor
        self.preprocessor.save(preprocessor_path)
    
    @classmethod
    def load(cls, model_path: str, preprocessor_path: str) -> 'ModelPipeline':
        """Load model and preprocessor from disk"""
        model_data = joblib.load(model_path)
        
        instance = cls(
            model_type=model_data['model_type'],
            model_params=model_data['model_params']
        )
        instance.model = model_data['model']
        instance.training_result = model_data['training_result']
        instance.mapping_result = model_data['mapping_result']
        instance.preprocessor = AdaptivePreprocessor.load(preprocessor_path)
        instance._is_trained = True
        
        return instance
