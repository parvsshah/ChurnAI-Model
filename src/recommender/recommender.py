"""
Main Recommendation Engine

Combines signal detection and action generation into a unified
recommendation pipeline. Provides both per-customer and batch recommendations.
Now with LLM-powered personalized recommendations and summary reports.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mappers.column_mapper import MappingResult
from recommender.signal_detector import SignalDetector, CustomerSignals
from recommender.action_generator import ActionGenerator, CustomerRecommendations

# Try to import LLM engine
try:
    from llm.llm_engine import LLMEngine, get_llm_engine
    HAS_LLM = True
except ImportError:
    HAS_LLM = False


@dataclass
class RecommendationOutput:
    """Complete recommendation output for a customer"""
    customer_id: Optional[str]
    churn_probability: Optional[float]
    churn_prediction: str
    risk_level: str
    signals: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    summary: str
    priority: str
    # LLM-powered fields
    ai_narrative: Optional[str] = None
    ai_personalized_actions: Optional[List[str]] = None


class RecommendationEngine:
    """
    Domain-agnostic recommendation engine for churn prevention.
    
    Combines:
    - Signal detection (risk factors)
    - Action generation (recommendations)
    - Priority ranking
    - LLM-powered personalized insights (optional)
    """
    
    def __init__(
        self,
        mapping_result: Optional[MappingResult] = None,
        custom_action_templates: Optional[Dict[str, List[str]]] = None,
        use_llm: bool = True
    ):
        """
        Initialize recommendation engine.
        
        Args:
            mapping_result: Column mappings for semantic understanding
            custom_action_templates: Custom action templates
            use_llm: Whether to use LLM for personalized recommendations
        """
        self.signal_detector = SignalDetector(mapping_result)
        self.action_generator = ActionGenerator(custom_action_templates)
        self.mapping_result = mapping_result
        self._is_fitted = False
        
        # LLM integration
        self.use_llm = use_llm and HAS_LLM
        self.llm_engine = get_llm_engine() if self.use_llm else None
        self.domain_context = None
    
    def fit(self, df: pd.DataFrame, mapping_result: Optional[MappingResult] = None):
        """
        Fit the engine on training data to compute thresholds.
        
        Args:
            df: Training DataFrame
            mapping_result: Column mappings (optional if already set)
        """
        if mapping_result:
            self.mapping_result = mapping_result
            self.signal_detector.set_mapping(mapping_result)
        
        if self.mapping_result is None:
            raise ValueError("Column mappings not provided")
        
        # Compute data-driven thresholds
        self.signal_detector.compute_thresholds(df)
        
        # Detect domain using LLM
        if self.llm_engine and self.llm_engine.available:
            sample_values = {col: df[col].dropna().head(3).tolist() for col in df.columns[:10]}
            self.domain_context = self.llm_engine.detect_domain(list(df.columns), sample_values)
        
        self._is_fitted = True
    
    def recommend(
        self,
        row: pd.Series,
        churn_probability: Optional[float] = None,
        churn_prediction: Optional[str] = None
    ) -> RecommendationOutput:
        """
        Generate recommendations for a single customer.
        
        Args:
            row: Customer data as pandas Series
            churn_probability: Predicted churn probability
            churn_prediction: "Yes" or "No"
            
        Returns:
            RecommendationOutput with complete recommendations
        """
        if not self._is_fitted:
            raise ValueError("Engine not fitted. Call fit() first.")
        
        # Detect signals
        customer_signals = self.signal_detector.detect_signals(row, churn_probability)
        
        # Generate actions
        recommendations = self.action_generator.generate_actions(customer_signals)
        
        # Build output
        return RecommendationOutput(
            customer_id=customer_signals.customer_id,
            churn_probability=churn_probability,
            churn_prediction=churn_prediction or ("Yes" if (churn_probability or 0) >= 0.5 else "No"),
            risk_level=customer_signals.overall_risk,
            signals=[{
                "type": s.signal_type,
                "description": s.description,
                "risk": s.risk_level,
                "evidence": s.evidence
            } for s in customer_signals.signals],
            recommendations=[{
                "action": a.description,
                "priority": a.priority,
                "type": a.action_type
            } for a in recommendations.actions],
            summary=recommendations.summary,
            priority=recommendations.priority_level
        )
    
    def recommend_batch(
        self,
        df: pd.DataFrame,
        churn_probabilities: Optional[np.ndarray] = None,
        churn_predictions: Optional[List[str]] = None
    ) -> List[RecommendationOutput]:
        """
        Generate recommendations for multiple customers.
        
        Args:
            df: DataFrame with customer data
            churn_probabilities: Array of predicted probabilities
            churn_predictions: List of predictions ("Yes"/"No")
            
        Returns:
            List of RecommendationOutput
        """
        results = []
        for i, (_, row) in enumerate(df.iterrows()):
            prob = churn_probabilities[i] if churn_probabilities is not None else None
            pred = churn_predictions[i] if churn_predictions is not None else None
            results.append(self.recommend(row, prob, pred))
        return results
    
    def to_dataframe(self, recommendations: List[RecommendationOutput]) -> pd.DataFrame:
        """
        Convert recommendations to DataFrame format.
        
        Args:
            recommendations: List of RecommendationOutput
            
        Returns:
            DataFrame with recommendation columns
        """
        records = []
        for rec in recommendations:
            # Format signals as string
            signals_str = "; ".join([
                f"{s['type']}: {s['description']}"
                for s in rec.signals
            ]) if rec.signals else "None detected"
            
            # Format recommendations as string
            actions_str = "; ".join([
                f"[{r['priority'].upper()}] {r['action']}"
                for r in rec.recommendations[:3]  # Top 3 actions
            ]) if rec.recommendations else "No action needed"
            
            records.append({
                "customer_id": rec.customer_id,
                "churn_probability": rec.churn_probability,
                "churn_prediction": rec.churn_prediction,
                "risk_level": rec.risk_level,
                "priority": rec.priority,
                "churn_signals": signals_str,
                "recommendations": actions_str,
                "summary": rec.summary
            })
        
        return pd.DataFrame(records)
    
    def get_high_risk_report(
        self,
        recommendations: List[RecommendationOutput],
        min_risk: str = "high"
    ) -> str:
        """
        Generate a report for high-risk customers.
        
        Args:
            recommendations: List of recommendations
            min_risk: Minimum risk level to include
            
        Returns:
            Formatted report string
        """
        risk_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        min_level = risk_levels.get(min_risk, 3)
        
        high_risk = [r for r in recommendations 
                     if risk_levels.get(r.risk_level, 0) >= min_level]
        
        if not high_risk:
            return "No high-risk customers identified."
        
        lines = [
            "=" * 70,
            f"HIGH-RISK CUSTOMER REPORT ({len(high_risk)} customers)",
            "=" * 70,
        ]
        
        # Sort by risk level
        high_risk.sort(
            key=lambda r: (risk_levels.get(r.risk_level, 0), r.churn_probability or 0),
            reverse=True
        )
        
        for rec in high_risk[:20]:  # Top 20
            lines.append(f"\n{'─' * 60}")
            lines.append(f"Customer: {rec.customer_id or 'Unknown'}")
            lines.append(f"Risk Level: {rec.risk_level.upper()}")
            if rec.churn_probability:
                lines.append(f"Churn Probability: {rec.churn_probability:.1%}")
            
            lines.append("\nSignals:")
            for s in rec.signals[:3]:
                lines.append(f"  • [{s['risk'].upper()}] {s['description']}")
            
            lines.append("\nRecommended Actions:")
            for r in rec.recommendations[:3]:
                lines.append(f"  → [{r['priority'].upper()}] {r['action']}")
        
        lines.append("\n" + "=" * 70)
        return "\n".join(lines)
    
    def get_summary_statistics(
        self,
        recommendations: List[RecommendationOutput]
    ) -> Dict[str, Any]:
        """
        Get summary statistics for all recommendations.
        
        Args:
            recommendations: List of recommendations
            
        Returns:
            Dictionary with statistics
        """
        total = len(recommendations)
        
        risk_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        signal_counts = {}
        total_signals = 0
        
        for rec in recommendations:
            risk_dist[rec.risk_level] += 1
            for s in rec.signals:
                signal_counts[s["type"]] = signal_counts.get(s["type"], 0) + 1
                total_signals += 1
        
        probs = [r.churn_probability for r in recommendations if r.churn_probability]
        
        return {
            "total_customers": total,
            "risk_distribution": risk_dist,
            "risk_percentages": {k: f"{v/total*100:.1f}%" for k, v in risk_dist.items()},
            "high_risk_count": risk_dist["high"] + risk_dist["critical"],
            "signal_frequency": dict(sorted(signal_counts.items(), key=lambda x: x[1], reverse=True)),
            "avg_signals_per_customer": round(total_signals / max(total, 1), 2),
            "avg_churn_probability": round(np.mean(probs) if probs else 0, 4),
            "customers_above_70pct": sum(1 for p in probs if p >= 0.7)
        }
    
    def generate_ai_summary(
        self,
        recommendations: List[RecommendationOutput]
    ) -> Optional[str]:
        """
        Generate an AI-powered executive summary report.
        
        Uses LLM to create a natural language summary with insights
        and strategic recommendations.
        
        Args:
            recommendations: List of recommendations
            
        Returns:
            Formatted markdown summary report, or None if LLM unavailable
        """
        if not self.llm_engine or not self.llm_engine.available:
            return None
        
        stats = self.get_summary_statistics(recommendations)
        top_signals = list(stats['signal_frequency'].keys())[:5]
        
        return self.llm_engine.generate_summary_report(
            total_customers=stats['total_customers'],
            high_risk_count=stats['high_risk_count'],
            avg_churn_probability=stats['avg_churn_probability'],
            risk_distribution=stats['risk_distribution'],
            top_signals=top_signals,
            domain_context=self.domain_context
        )
    
    def generate_ai_recommendations(
        self,
        df: pd.DataFrame,
        recommendations: List[RecommendationOutput],
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered personalized recommendations for high-risk customers.
        
        Args:
            df: Original DataFrame with customer data
            recommendations: List of recommendations
            top_n: Number of top high-risk customers to analyze
            
        Returns:
            List of AI-generated personalized recommendations
        """
        if not self.llm_engine or not self.llm_engine.available:
            return []
        
        # Get high-risk customers
        risk_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        high_risk = sorted(
            [(i, r) for i, r in enumerate(recommendations) if risk_levels.get(r.risk_level, 0) >= 3],
            key=lambda x: (risk_levels.get(x[1].risk_level, 0), x[1].churn_probability or 0),
            reverse=True
        )[:top_n]
        
        ai_recommendations = []
        for idx, rec in high_risk:
            customer_data = df.iloc[idx].to_dict()
            signals = [s['description'] for s in rec.signals]
            
            ai_rec = self.llm_engine.generate_personalized_recommendation(
                customer_data=customer_data,
                signals=signals,
                churn_probability=rec.churn_probability or 0.5,
                domain_context=self.domain_context
            )
            
            if ai_rec:
                ai_recommendations.append({
                    "customer_id": rec.customer_id,
                    "churn_probability": rec.churn_probability,
                    "risk_level": rec.risk_level,
                    "ai_risk_assessment": ai_rec.risk_assessment,
                    "ai_personalized_actions": ai_rec.personalized_actions,
                    "ai_key_insight": ai_rec.key_insights,
                    "ai_priority": ai_rec.priority
                })
        
        return ai_recommendations
    
    def get_ai_enhanced_report(
        self,
        df: pd.DataFrame,
        recommendations: List[RecommendationOutput]
    ) -> str:
        """
        Generate a comprehensive AI-enhanced report.
        
        Combines:
        - Executive summary (AI-generated)
        - High-risk customer analysis (AI-powered)
        - Statistical insights
        
        Returns:
            Complete formatted report
        """
        lines = [
            "=" * 70,
            "🤖 AI-ENHANCED CHURN ANALYSIS REPORT",
            "=" * 70
        ]
        
        # Domain context
        if self.domain_context:
            lines.append(f"\n📊 Detected Domain: {self.domain_context}")
        
        # AI Executive Summary
        ai_summary = self.generate_ai_summary(recommendations)
        if ai_summary:
            lines.append("\n" + "-" * 70)
            lines.append("📝 EXECUTIVE SUMMARY (AI-Generated)")
            lines.append("-" * 70)
            lines.append(ai_summary)
        else:
            # Fallback to stats-based summary
            stats = self.get_summary_statistics(recommendations)
            lines.append("\n📊 ANALYSIS SUMMARY")
            lines.append(f"Total Customers: {stats['total_customers']}")
            lines.append(f"High Risk: {stats['high_risk_count']} customers")
            lines.append(f"Average Churn Probability: {stats['avg_churn_probability']:.1%}")
        
        # AI Personalized Recommendations for top customers
        ai_recs = self.generate_ai_recommendations(df, recommendations, top_n=5)
        if ai_recs:
            lines.append("\n" + "-" * 70)
            lines.append("🎯 PERSONALIZED AI RECOMMENDATIONS (Top 5 High-Risk)")
            lines.append("-" * 70)
            
            for rec in ai_recs:
                lines.append(f"\n▶ Customer: {rec['customer_id']}")
                lines.append(f"  Risk: {rec['risk_level'].upper()} ({rec['churn_probability']:.1%})")
                lines.append(f"  AI Assessment: {rec['ai_risk_assessment']}")
                lines.append(f"  Key Insight: {rec['ai_key_insight']}")
                lines.append("  AI Recommended Actions:")
                for action in rec['ai_personalized_actions'][:3]:
                    lines.append(f"    • {action}")
        
        lines.append("\n" + "=" * 70)
        return "\n".join(lines)

