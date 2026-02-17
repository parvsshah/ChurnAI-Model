"""
Signal Detector for Recommendation Engine

Detects generic churn signals in a domain-agnostic way.
Analyzes customer data to identify risk factors.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.schema_config import ColumnType, CHURN_SIGNALS
from mappers.column_mapper import MappingResult


@dataclass
class Signal:
    """Represents a detected churn signal"""
    signal_type: str
    description: str
    risk_level: str  # "low", "medium", "high", "critical"
    evidence: str
    column_involved: Optional[str] = None
    value: Optional[Any] = None
    threshold: Optional[Any] = None


@dataclass
class CustomerSignals:
    """All signals detected for a customer"""
    customer_id: Optional[str] = None
    signals: List[Signal] = field(default_factory=list)
    overall_risk: str = "low"
    churn_probability: Optional[float] = None
    
    def add_signal(self, signal: Signal):
        self.signals.append(signal)
        self._update_overall_risk()
    
    def _update_overall_risk(self):
        """
        Update overall risk based on CHURN PROBABILITY first, then signals.
        
        Risk levels based on probability:
        - critical: >= 70%
        - high: >= 50%
        - medium: >= 25%
        - low: < 25%
        """
        # Primary factor: churn probability
        if self.churn_probability is not None:
            prob = self.churn_probability
            if prob >= 0.70:
                self.overall_risk = "critical"
            elif prob >= 0.50:
                self.overall_risk = "high"
            elif prob >= 0.25:
                self.overall_risk = "medium"
            else:
                self.overall_risk = "low"
            return
        
        # Fallback: if no probability, use signals
        risk_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        max_risk = max((risk_levels.get(s.risk_level, 1) for s in self.signals), default=1)
        
        # Also factor in number of signals
        if len(self.signals) >= 4:
            max_risk = min(max_risk + 1, 4)
        
        reverse_map = {1: "low", 2: "medium", 3: "high", 4: "critical"}
        self.overall_risk = reverse_map[max_risk]


class SignalDetector:
    """
    Detects churn risk signals in customer data.
    
    Uses data-driven thresholds and semantic column understanding.
    """
    
    def __init__(self, mapping_result: Optional[MappingResult] = None):
        """
        Initialize signal detector.
        
        Args:
            mapping_result: Column mappings for semantic understanding
        """
        self.mapping_result = mapping_result
        self.thresholds: Dict[str, Any] = {}
    
    def set_mapping(self, mapping_result: MappingResult):
        """Set or update column mappings"""
        self.mapping_result = mapping_result
    
    def compute_thresholds(self, df: pd.DataFrame):
        """
        Compute data-driven thresholds from the dataset.
        
        Args:
            df: Full dataset to compute thresholds from
        """
        if self.mapping_result is None:
            raise ValueError("Column mappings not set")
        
        # Get columns by type
        cost_cols = self._get_columns_by_type([ColumnType.COST_MONTHLY, ColumnType.COST_TOTAL])
        tenure_cols = self._get_columns_by_type([ColumnType.TENURE])
        contract_cols = self._get_columns_by_type([ColumnType.CONTRACT])
        
        # Compute percentile thresholds for cost
        for col in cost_cols:
            if col in df.columns:
                # Convert to numeric, handling spaces and other non-numeric values
                numeric_col = pd.to_numeric(df[col].replace(r'^\s*$', np.nan, regex=True), errors='coerce')
                if numeric_col.notna().sum() > 0:
                    self.thresholds[f"{col}_high"] = numeric_col.quantile(0.75)
                    self.thresholds[f"{col}_median"] = numeric_col.median()
        
        # Compute percentile thresholds for tenure
        for col in tenure_cols:
            if col in df.columns:
                # Convert to numeric if needed
                numeric_col = pd.to_numeric(df[col].replace(r'^\s*$', np.nan, regex=True), errors='coerce')
                if numeric_col.notna().sum() > 0:
                    self.thresholds[f"{col}_low"] = numeric_col.quantile(0.25)
                    self.thresholds[f"{col}_median"] = numeric_col.median()
        
        # Identify low commitment values for contract
        for col in contract_cols:
            if col in df.columns:
                values = df[col].astype(str).str.lower().unique()
                low_commit = [v for v in values if any(
                    kw in v for kw in ["month", "no ", "none", "basic", "free"]
                )]
                self.thresholds[f"{col}_low_commitment"] = low_commit
        
        # Compute feature statistics for missing feature detection
        binary_cols = self._get_columns_by_type([ColumnType.BINARY])
        service_engagement = {}
        for col in binary_cols:
            if col in df.columns:
                # Calculate % of customers with this feature
                pos_values = df[col].astype(str).str.lower().isin(['yes', '1', 'true'])
                service_engagement[col] = pos_values.mean()
        self.thresholds['service_engagement'] = service_engagement
    
    def detect_signals(
        self, 
        row: pd.Series, 
        churn_probability: Optional[float] = None
    ) -> CustomerSignals:
        """
        Detect churn signals for a single customer.
        
        Args:
            row: Customer data as pandas Series
            churn_probability: Predicted churn probability
            
        Returns:
            CustomerSignals with all detected signals
        """
        result = CustomerSignals(churn_probability=churn_probability)
        
        # Get ID if available
        id_cols = self._get_columns_by_type([ColumnType.ID])
        if id_cols and id_cols[0] in row.index:
            result.customer_id = str(row[id_cols[0]])
        
        # Check high churn probability
        if churn_probability is not None and churn_probability >= 0.7:
            result.add_signal(Signal(
                signal_type="high_churn_probability",
                description="Model predicts high likelihood of churn",
                risk_level="critical" if churn_probability >= 0.85 else "high",
                evidence=f"Churn probability: {churn_probability:.1%}",
                value=churn_probability,
                threshold=0.7
            ))
        
        # Check high cost
        self._check_high_cost(row, result)
        
        # Check low tenure
        self._check_low_tenure(row, result)
        
        # Check commitment level
        self._check_commitment(row, result)
        
        # Check missing value-add features
        self._check_missing_features(row, result)
        
        # Final risk calculation based on probability (override signal-based)
        result._update_overall_risk()
        
        return result
    
    def detect_signals_batch(
        self, 
        df: pd.DataFrame, 
        churn_probabilities: Optional[np.ndarray] = None
    ) -> List[CustomerSignals]:
        """
        Detect signals for multiple customers.
        
        Args:
            df: DataFrame with customer data
            churn_probabilities: Array of predicted probabilities
            
        Returns:
            List of CustomerSignals for each customer
        """
        results = []
        for i, (_, row) in enumerate(df.iterrows()):
            prob = churn_probabilities[i] if churn_probabilities is not None else None
            results.append(self.detect_signals(row, prob))
        return results
    
    def _get_columns_by_type(self, types: List[ColumnType]) -> List[str]:
        """Get column names for given types"""
        if self.mapping_result is None:
            return []
        return [col for col, m in self.mapping_result.mappings.items() 
                if m.target_type in types]
    
    def _check_high_cost(self, row: pd.Series, result: CustomerSignals):
        """Check for high cost signals"""
        cost_cols = self._get_columns_by_type([ColumnType.COST_MONTHLY, ColumnType.COST_TOTAL])
        
        for col in cost_cols:
            if col in row.index:
                threshold_key = f"{col}_high"
                if threshold_key in self.thresholds:
                    value = row[col]
                    threshold = self.thresholds[threshold_key]
                    
                    # Convert to numeric if needed
                    try:
                        if isinstance(value, str):
                            value = pd.to_numeric(value.strip(), errors='coerce')
                        if pd.notna(value) and pd.notna(threshold) and float(value) > float(threshold):
                            result.add_signal(Signal(
                                signal_type="high_cost",
                                description=f"High charges in {col}",
                                risk_level="medium",
                                evidence=f"{col} = {float(value):.2f} (above 75th percentile: {float(threshold):.2f})",
                                column_involved=col,
                                value=float(value),
                                threshold=float(threshold)
                            ))
                    except (ValueError, TypeError):
                        pass  # Skip if conversion fails
    
    def _check_low_tenure(self, row: pd.Series, result: CustomerSignals):
        """Check for low tenure signals"""
        tenure_cols = self._get_columns_by_type([ColumnType.TENURE])
        
        for col in tenure_cols:
            if col in row.index:
                threshold_key = f"{col}_low"
                if threshold_key in self.thresholds:
                    value = row[col]
                    threshold = self.thresholds[threshold_key]
                    
                    if pd.notna(value) and value < threshold:
                        result.add_signal(Signal(
                            signal_type="low_tenure",
                            description="New or short-tenure customer",
                            risk_level="high",
                            evidence=f"{col} = {value} (below 25th percentile: {threshold})",
                            column_involved=col,
                            value=value,
                            threshold=threshold
                        ))
    
    def _check_commitment(self, row: pd.Series, result: CustomerSignals):
        """Check for weak commitment signals"""
        contract_cols = self._get_columns_by_type([ColumnType.CONTRACT])
        
        for col in contract_cols:
            if col in row.index:
                threshold_key = f"{col}_low_commitment"
                if threshold_key in self.thresholds:
                    value = str(row[col]).lower()
                    low_commit_values = self.thresholds[threshold_key]
                    
                    if value in low_commit_values:
                        result.add_signal(Signal(
                            signal_type="no_commitment",
                            description="No long-term commitment",
                            risk_level="high",
                            evidence=f"{col} = '{row[col]}' (short-term/no contract)",
                            column_involved=col,
                            value=row[col]
                        ))
    
    def _check_missing_features(self, row: pd.Series, result: CustomerSignals):
        """Check for missing value-add features"""
        binary_cols = self._get_columns_by_type([ColumnType.BINARY])
        engagement = self.thresholds.get('service_engagement', {})
        
        missing_popular = []
        for col in binary_cols:
            if col in row.index and col in engagement:
                # If this feature is popular (>50% adoption) but customer doesn't have it
                if engagement[col] > 0.5:
                    value = str(row[col]).lower()
                    if value in ['no', '0', 'false', 'none', '']:
                        missing_popular.append(col)
        
        if len(missing_popular) >= 2:
            result.add_signal(Signal(
                signal_type="missing_features",
                description="Lacks popular value-added services",
                risk_level="medium",
                evidence=f"Missing: {', '.join(missing_popular[:5])}",
                value=missing_popular
            ))
    
    def get_signal_summary(self, signals_list: List[CustomerSignals]) -> Dict[str, Any]:
        """Get summary statistics of detected signals"""
        total = len(signals_list)
        
        risk_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        signal_type_counts = {}
        
        for cs in signals_list:
            risk_counts[cs.overall_risk] += 1
            for s in cs.signals:
                signal_type_counts[s.signal_type] = signal_type_counts.get(s.signal_type, 0) + 1
        
        return {
            "total_customers": total,
            "risk_distribution": risk_counts,
            "risk_percentages": {k: v/total*100 for k, v in risk_counts.items()},
            "signal_frequency": signal_type_counts,
            "avg_signals_per_customer": sum(len(s.signals) for s in signals_list) / max(total, 1)
        }
