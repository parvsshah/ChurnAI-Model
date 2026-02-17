"""
Schema Validator for Adaptive Churn Prediction System

Validates that uploaded datasets meet the minimum requirements
for churn prediction while allowing flexible column names.
"""

import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.schema_config import ColumnType, DEFAULT_SCHEMA
from mappers.column_mapper import ColumnMapper, MappingResult


@dataclass
class ValidationResult:
    """Result of schema validation"""
    is_valid: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    mapping_result: Optional[MappingResult] = None
    data_quality_score: float = 0.0


class SchemaValidator:
    """
    Validates datasets for churn prediction compatibility.
    
    Checks:
    1. Required column types are present (at least mapped)
    2. Data quality (missing values, data types)
    3. Target variable format
    """
    
    REQUIRED_TYPES = [ColumnType.TARGET, ColumnType.TENURE]
    RECOMMENDED_TYPES = [ColumnType.COST_MONTHLY, ColumnType.CONTRACT]
    
    def __init__(self, column_mapper: Optional[ColumnMapper] = None):
        """
        Initialize validator with optional column mapper.
        
        Args:
            column_mapper: ColumnMapper instance for semantic detection
        """
        self.column_mapper = column_mapper or ColumnMapper()
    
    def validate(
        self,
        df: pd.DataFrame,
        mapping_result: Optional[MappingResult] = None,
        strict: bool = False
    ) -> ValidationResult:
        """
        Validate a DataFrame for churn prediction.
        
        Args:
            df: Input DataFrame to validate
            mapping_result: Pre-computed column mappings (optional)
            strict: If True, all recommended columns are required
            
        Returns:
            ValidationResult with validation status and details
        """
        result = ValidationResult()
        
        # Step 1: Get column mappings if not provided
        if mapping_result is None:
            mapping_result = self.column_mapper.map_columns(df, mode="auto")
        result.mapping_result = mapping_result
        
        # Step 2: Check required column types
        mapped_types = {m.target_type for m in mapping_result.mappings.values()}
        
        for req_type in self.REQUIRED_TYPES:
            if req_type not in mapped_types:
                result.is_valid = False
                result.errors.append(
                    f"Missing required column type: {req_type.value}. "
                    f"Please ensure your dataset has a column for '{DEFAULT_SCHEMA[req_type].description}'"
                )
        
        # Step 3: Check recommended columns
        for rec_type in self.RECOMMENDED_TYPES:
            if rec_type not in mapped_types:
                msg = f"Recommended column type not found: {rec_type.value}"
                if strict:
                    result.is_valid = False
                    result.errors.append(msg)
                else:
                    result.warnings.append(msg)
        
        # Step 4: Validate target column
        target_cols = [col for col, m in mapping_result.mappings.items() 
                       if m.target_type == ColumnType.TARGET]
        if target_cols:
            target_validation = self._validate_target_column(df[target_cols[0]])
            result.errors.extend(target_validation["errors"])
            result.warnings.extend(target_validation["warnings"])
            if target_validation["errors"]:
                result.is_valid = False
        
        # Step 5: Check data quality
        quality_result = self._check_data_quality(df, mapping_result)
        result.data_quality_score = quality_result["score"]
        result.warnings.extend(quality_result["warnings"])
        
        # Step 6: Check for minimum rows
        if len(df) < 100:
            result.warnings.append(
                f"Dataset has only {len(df)} rows. "
                "Predictions may be less reliable with small datasets."
            )
        
        return result
    
    def _validate_target_column(self, series: pd.Series) -> Dict:
        """Validate the target (churn) column"""
        result = {"errors": [], "warnings": []}
        
        # Check for missing values in target
        missing_pct = series.isna().sum() / len(series) * 100
        if missing_pct > 0:
            result["errors"].append(
                f"Target column has {missing_pct:.1f}% missing values. "
                "Target column must not have missing values."
            )
        
        # Check for binary values
        unique_vals = series.dropna().unique()
        if len(unique_vals) > 2:
            result["warnings"].append(
                f"Target column has {len(unique_vals)} unique values. "
                "Expected binary (0/1 or Yes/No)."
            )
        
        # Check for class imbalance
        if len(unique_vals) == 2:
            val_counts = series.value_counts(normalize=True)
            minority_pct = val_counts.min() * 100
            if minority_pct < 10:
                result["warnings"].append(
                    f"Severe class imbalance detected: minority class is only {minority_pct:.1f}%. "
                    "Consider using techniques like SMOTE or class weights."
                )
        
        return result
    
    def _check_data_quality(self, df: pd.DataFrame, mapping_result: MappingResult) -> Dict:
        """Check overall data quality"""
        result = {"score": 100.0, "warnings": []}
        
        # Check missing values
        total_missing = df.isna().sum().sum()
        total_cells = df.size
        missing_pct = (total_missing / total_cells) * 100
        
        if missing_pct > 20:
            result["warnings"].append(
                f"High missing value rate: {missing_pct:.1f}% of data is missing."
            )
            result["score"] -= min(30, missing_pct)
        elif missing_pct > 5:
            result["warnings"].append(
                f"Moderate missing values: {missing_pct:.1f}% of data is missing."
            )
            result["score"] -= missing_pct
        
        # Check for duplicate rows
        dup_count = df.duplicated().sum()
        if dup_count > 0:
            dup_pct = (dup_count / len(df)) * 100
            result["warnings"].append(
                f"Found {dup_count} duplicate rows ({dup_pct:.1f}%)."
            )
            result["score"] -= min(10, dup_pct)
        
        # Check numeric column quality
        for col, mapping in mapping_result.mappings.items():
            if mapping.target_type in [ColumnType.COST_MONTHLY, ColumnType.COST_TOTAL, 
                                        ColumnType.TENURE, ColumnType.NUMERIC]:
                if col in df.columns:
                    # Only check numeric columns
                    if not pd.api.types.is_numeric_dtype(df[col]):
                        # Try to convert to numeric
                        numeric_col = pd.to_numeric(df[col], errors='coerce')
                        if numeric_col.isna().sum() > len(df) * 0.1:
                            result["warnings"].append(
                                f"Column '{col}' mapped as numeric but contains non-numeric values."
                            )
                        continue
                    
                    # Check for negative values where not expected
                    if (df[col] < 0).any():
                        result["warnings"].append(
                            f"Column '{col}' contains negative values."
                        )
                    
                    # Check for outliers using IQR
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    if IQR > 0:
                        outliers = ((df[col] < Q1 - 3*IQR) | (df[col] > Q3 + 3*IQR)).sum()
                        if outliers > len(df) * 0.05:
                            result["warnings"].append(
                                f"Column '{col}' has {outliers} potential outliers."
                            )
        
        result["score"] = max(0, result["score"])
        return result
    
    def get_validation_report(self, result: ValidationResult) -> str:
        """Generate a human-readable validation report"""
        lines = []
        lines.append("=" * 60)
        lines.append("DATASET VALIDATION REPORT")
        lines.append("=" * 60)
        
        # Status
        status = "✅ VALID" if result.is_valid else "❌ INVALID"
        lines.append(f"\nStatus: {status}")
        lines.append(f"Data Quality Score: {result.data_quality_score:.1f}/100")
        
        # Column mappings
        if result.mapping_result:
            lines.append("\n📊 Column Mappings:")
            for col, mapping in result.mapping_result.mappings.items():
                lines.append(f"  • {col} → {mapping.target_type.value} "
                           f"({mapping.detection_method}, {mapping.confidence:.0%})")
            
            if result.mapping_result.unmapped_columns:
                lines.append("\n⚠️ Unmapped Columns:")
                for col in result.mapping_result.unmapped_columns:
                    lines.append(f"  • {col}")
        
        # Errors
        if result.errors:
            lines.append("\n❌ Errors:")
            for err in result.errors:
                lines.append(f"  • {err}")
        
        # Warnings
        if result.warnings:
            lines.append("\n⚠️ Warnings:")
            for warn in result.warnings:
                lines.append(f"  • {warn}")
        
        # LLM insights
        if result.mapping_result and result.mapping_result.llm_insights:
            lines.append("\n🤖 AI Insights:")
            lines.append(f"  {result.mapping_result.llm_insights}")
        
        lines.append("\n" + "=" * 60)
        
        return "\n".join(lines)
