"""
Dataset Validator

Pre-validates datasets before training/prediction to ensure compatibility.
Catches issues like:
- Missing target column
- Data type mismatches
- Too many missing values
- Unsupported column types
- Encoding issues
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.schema_config import ColumnType


class ValidationStatus(Enum):
    """Validation result status"""
    PASS = "pass"
    WARNING = "warning"
    FAIL = "fail"


@dataclass
class ValidationIssue:
    """Single validation issue"""
    check_name: str
    status: ValidationStatus
    message: str
    column: Optional[str] = None
    details: Optional[str] = None
    fix_suggestion: Optional[str] = None


@dataclass 
class ValidationReport:
    """Complete validation report"""
    file_path: str
    is_valid: bool
    can_train: bool
    can_predict: bool
    issues: List[ValidationIssue] = field(default_factory=list)
    column_summary: Dict[str, Any] = field(default_factory=dict)
    
    def add_issue(self, issue: ValidationIssue):
        self.issues.append(issue)
        if issue.status == ValidationStatus.FAIL:
            self.is_valid = False
    
    def get_summary(self) -> str:
        """Get human-readable summary"""
        lines = []
        lines.append("=" * 60)
        lines.append("📋 DATASET VALIDATION REPORT")
        lines.append("=" * 60)
        lines.append(f"\n📁 File: {os.path.basename(self.file_path)}")
        
        # Overall status
        if self.is_valid:
            lines.append("✅ Status: VALID - Ready for processing")
        else:
            lines.append("❌ Status: INVALID - Issues need fixing")
        
        lines.append(f"   Can Train: {'✓' if self.can_train else '✗'}")
        lines.append(f"   Can Predict: {'✓' if self.can_predict else '✗'}")
        
        # Column summary
        if self.column_summary:
            lines.append(f"\n📊 Columns Detected:")
            lines.append(f"   Total: {self.column_summary.get('total', 0)}")
            lines.append(f"   Numeric: {self.column_summary.get('numeric', 0)}")
            lines.append(f"   Categorical: {self.column_summary.get('categorical', 0)}")
            lines.append(f"   Target: {'✓ Found' if self.column_summary.get('has_target') else '✗ Not found'}")
        
        # Issues
        fails = [i for i in self.issues if i.status == ValidationStatus.FAIL]
        warnings = [i for i in self.issues if i.status == ValidationStatus.WARNING]
        passes = [i for i in self.issues if i.status == ValidationStatus.PASS]
        
        if fails:
            lines.append(f"\n❌ FAILURES ({len(fails)}):")
            for issue in fails:
                lines.append(f"   • {issue.message}")
                if issue.fix_suggestion:
                    lines.append(f"     💡 Fix: {issue.fix_suggestion}")
        
        if warnings:
            lines.append(f"\n⚠️  WARNINGS ({len(warnings)}):")
            for issue in warnings:
                lines.append(f"   • {issue.message}")
                if issue.fix_suggestion:
                    lines.append(f"     💡 Suggestion: {issue.fix_suggestion}")
        
        if passes and not fails:
            lines.append(f"\n✅ PASSED ({len(passes)}):")
            for issue in passes[:5]:  # Show first 5 passes
                lines.append(f"   • {issue.message}")
            if len(passes) > 5:
                lines.append(f"   ... and {len(passes) - 5} more checks passed")
        
        lines.append("\n" + "=" * 60)
        return "\n".join(lines)


class DatasetValidator:
    """
    Validates datasets before processing.
    
    Usage:
        validator = DatasetValidator()
        report = validator.validate("path/to/data.csv")
        print(report.get_summary())
        
        if report.is_valid:
            # Safe to proceed
            ...
    """
    
    # Target column patterns
    TARGET_PATTERNS = [
        'churn', 'churned', 'attrition', 'attrited', 'exited', 'left',
        'cancelled', 'canceled', 'target', 'label', 'outcome'
    ]
    
    def __init__(self):
        self.column_mapper = None
        try:
            from mappers.column_mapper import ColumnMapper
            self.column_mapper = ColumnMapper()
        except ImportError:
            pass
    
    def validate(self, file_path: str) -> ValidationReport:
        """
        Validate a dataset file.
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            ValidationReport with all issues found
        """
        report = ValidationReport(
            file_path=file_path,
            is_valid=True,
            can_train=True,
            can_predict=True
        )
        
        # Check file exists
        if not self._check_file_exists(file_path, report):
            return report
        
        # Try to load the file
        df = self._check_file_readable(file_path, report)
        if df is None:
            return report
        
        # Run all validations
        self._check_row_count(df, report)
        self._check_column_count(df, report)
        self._check_duplicate_columns(df, report)
        self._check_target_column(df, report)
        self._check_missing_values(df, report)
        self._check_data_types(df, report)
        self._check_special_characters(df, report)
        self._check_numeric_as_string(df, report)
        self._check_column_variance(df, report)
        
        # Generate column summary
        report.column_summary = self._get_column_summary(df)
        
        # Update can_train and can_predict based on issues
        for issue in report.issues:
            if issue.status == ValidationStatus.FAIL:
                if 'target' in issue.check_name.lower():
                    report.can_train = False
                else:
                    report.can_train = False
                    report.can_predict = False
        
        return report
    
    def _check_file_exists(self, path: str, report: ValidationReport) -> bool:
        """Check if file exists"""
        if os.path.exists(path):
            report.add_issue(ValidationIssue(
                check_name="file_exists",
                status=ValidationStatus.PASS,
                message="File exists and is accessible"
            ))
            return True
        else:
            report.add_issue(ValidationIssue(
                check_name="file_exists",
                status=ValidationStatus.FAIL,
                message=f"File not found: {path}",
                fix_suggestion="Check the file path is correct"
            ))
            return False
    
    def _check_file_readable(self, path: str, report: ValidationReport) -> Optional[pd.DataFrame]:
        """Check if file can be read as CSV"""
        try:
            df = pd.read_csv(path)
            report.add_issue(ValidationIssue(
                check_name="file_readable",
                status=ValidationStatus.PASS,
                message=f"Successfully loaded {len(df)} rows, {len(df.columns)} columns"
            ))
            return df
        except pd.errors.EmptyDataError:
            report.add_issue(ValidationIssue(
                check_name="file_readable",
                status=ValidationStatus.FAIL,
                message="File is empty",
                fix_suggestion="Ensure the CSV file contains data"
            ))
        except pd.errors.ParserError as e:
            report.add_issue(ValidationIssue(
                check_name="file_readable",
                status=ValidationStatus.FAIL,
                message=f"CSV parsing error: {str(e)[:100]}",
                fix_suggestion="Check for consistent delimiters and proper CSV formatting"
            ))
        except UnicodeDecodeError:
            report.add_issue(ValidationIssue(
                check_name="file_readable",
                status=ValidationStatus.FAIL,
                message="File encoding error",
                fix_suggestion="Try saving the file as UTF-8 encoded CSV"
            ))
        except Exception as e:
            report.add_issue(ValidationIssue(
                check_name="file_readable",
                status=ValidationStatus.FAIL,
                message=f"Error reading file: {str(e)[:100]}",
                fix_suggestion="Check file format and try re-exporting from source"
            ))
        return None
    
    def _check_row_count(self, df: pd.DataFrame, report: ValidationReport):
        """Check minimum row count"""
        if len(df) < 10:
            report.add_issue(ValidationIssue(
                check_name="row_count",
                status=ValidationStatus.FAIL,
                message=f"Too few rows ({len(df)}). Need at least 10 for training",
                fix_suggestion="Add more data or combine with another dataset"
            ))
        elif len(df) < 100:
            report.add_issue(ValidationIssue(
                check_name="row_count",
                status=ValidationStatus.WARNING,
                message=f"Low row count ({len(df)}). Recommend 100+ for reliable training",
                fix_suggestion="Consider gathering more training data"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="row_count",
                status=ValidationStatus.PASS,
                message=f"Sufficient rows: {len(df)}"
            ))
    
    def _check_column_count(self, df: pd.DataFrame, report: ValidationReport):
        """Check column count"""
        if len(df.columns) < 2:
            report.add_issue(ValidationIssue(
                check_name="column_count",
                status=ValidationStatus.FAIL,
                message="Need at least 2 columns (features + target)",
                fix_suggestion="Ensure dataset has features and a target column"
            ))
        elif len(df.columns) > 100:
            report.add_issue(ValidationIssue(
                check_name="column_count",
                status=ValidationStatus.WARNING,
                message=f"High column count ({len(df.columns)}). May slow processing",
                fix_suggestion="Consider feature selection to reduce dimensionality"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="column_count",
                status=ValidationStatus.PASS,
                message=f"Column count: {len(df.columns)}"
            ))
    
    def _check_duplicate_columns(self, df: pd.DataFrame, report: ValidationReport):
        """Check for duplicate column names"""
        duplicates = df.columns[df.columns.duplicated()].tolist()
        if duplicates:
            report.add_issue(ValidationIssue(
                check_name="duplicate_columns",
                status=ValidationStatus.FAIL,
                message=f"Duplicate column names: {duplicates[:5]}",
                fix_suggestion="Rename duplicate columns to have unique names"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="duplicate_columns",
                status=ValidationStatus.PASS,
                message="All column names are unique"
            ))
    
    def _check_target_column(self, df: pd.DataFrame, report: ValidationReport):
        """Check for target/churn column"""
        found_target = None
        
        for col in df.columns:
            col_lower = col.lower()
            for pattern in self.TARGET_PATTERNS:
                if pattern in col_lower:
                    found_target = col
                    break
            if found_target:
                break
        
        if found_target:
            # Check target has valid values
            unique_vals = df[found_target].nunique()
            if unique_vals == 2:
                report.add_issue(ValidationIssue(
                    check_name="target_column",
                    status=ValidationStatus.PASS,
                    message=f"Target column found: '{found_target}' (binary)",
                    column=found_target
                ))
            elif unique_vals < 10:
                report.add_issue(ValidationIssue(
                    check_name="target_column",
                    status=ValidationStatus.WARNING,
                    message=f"Target '{found_target}' has {unique_vals} unique values (expected 2 for binary)",
                    column=found_target,
                    fix_suggestion="Ensure target column is binary (0/1, Yes/No, True/False)"
                ))
            else:
                report.add_issue(ValidationIssue(
                    check_name="target_column",
                    status=ValidationStatus.FAIL,
                    message=f"Target '{found_target}' has too many values ({unique_vals})",
                    column=found_target,
                    fix_suggestion="Target should be binary for churn prediction"
                ))
        else:
            report.add_issue(ValidationIssue(
                check_name="target_column",
                status=ValidationStatus.FAIL,
                message="No target column found (looking for: churn, attrition, exited, etc.)",
                fix_suggestion="Rename your target column to 'Churn' or similar"
            ))
    
    def _check_missing_values(self, df: pd.DataFrame, report: ValidationReport):
        """Check for excessive missing values"""
        missing_pct = df.isnull().sum() / len(df) * 100
        high_missing = missing_pct[missing_pct > 50].index.tolist()
        any_missing = missing_pct[missing_pct > 0].index.tolist()
        
        if high_missing:
            report.add_issue(ValidationIssue(
                check_name="missing_values",
                status=ValidationStatus.WARNING,
                message=f"Columns with >50% missing: {high_missing[:5]}",
                fix_suggestion="Consider dropping or imputing these columns"
            ))
        elif any_missing:
            report.add_issue(ValidationIssue(
                check_name="missing_values",
                status=ValidationStatus.PASS,
                message=f"Some missing values in {len(any_missing)} columns (will be imputed)"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="missing_values",
                status=ValidationStatus.PASS,
                message="No missing values found"
            ))
    
    def _check_data_types(self, df: pd.DataFrame, report: ValidationReport):
        """Check data types are processable"""
        problematic = []
        for col in df.columns:
            dtype = df[col].dtype
            if dtype == 'object':
                # Check if it's all dates or complex objects
                sample = df[col].dropna().head(10)
                if sample.apply(lambda x: isinstance(x, (dict, list))).any():
                    problematic.append(col)
        
        if problematic:
            report.add_issue(ValidationIssue(
                check_name="data_types",
                status=ValidationStatus.FAIL,
                message=f"Complex data types found in: {problematic[:5]}",
                fix_suggestion="Flatten or convert complex types to simple values"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="data_types",
                status=ValidationStatus.PASS,
                message="All data types are compatible"
            ))
    
    def _check_special_characters(self, df: pd.DataFrame, report: ValidationReport):
        """Check for problematic special characters in column names"""
        problem_cols = []
        for col in df.columns:
            if any(c in str(col) for c in ['\\', '/', '\n', '\t', '\r']):
                problem_cols.append(col)
        
        if problem_cols:
            report.add_issue(ValidationIssue(
                check_name="special_characters",
                status=ValidationStatus.WARNING,
                message=f"Special characters in column names: {problem_cols[:3]}",
                fix_suggestion="Rename columns to use only alphanumeric and underscore"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="special_characters",
                status=ValidationStatus.PASS,
                message="Column names are clean"
            ))
    
    def _check_numeric_as_string(self, df: pd.DataFrame, report: ValidationReport):
        """Check for numeric values stored as strings"""
        issues = []
        for col in df.select_dtypes(include=['object']).columns:
            sample = df[col].dropna().head(100)
            numeric_count = pd.to_numeric(sample, errors='coerce').notna().sum()
            if numeric_count > len(sample) * 0.8:
                issues.append(col)
        
        if issues:
            report.add_issue(ValidationIssue(
                check_name="numeric_as_string",
                status=ValidationStatus.WARNING,
                message=f"Numeric data stored as text: {issues[:5]}",
                details=", ".join(issues),
                fix_suggestion="System will auto-convert, but explicit conversion is cleaner"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="numeric_as_string",
                status=ValidationStatus.PASS,
                message="Numeric columns have correct data type"
            ))
    
    def _check_column_variance(self, df: pd.DataFrame, report: ValidationReport):
        """Check for constant/near-constant columns"""
        low_variance = []
        for col in df.columns:
            if df[col].nunique() <= 1:
                low_variance.append(col)
        
        if low_variance:
            report.add_issue(ValidationIssue(
                check_name="column_variance",
                status=ValidationStatus.WARNING,
                message=f"Constant columns (no variance): {low_variance[:5]}",
                fix_suggestion="These columns will be ignored as they provide no information"
            ))
        else:
            report.add_issue(ValidationIssue(
                check_name="column_variance",
                status=ValidationStatus.PASS,
                message="All columns have variance"
            ))
    
    def _get_column_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get summary of columns"""
        numeric = len(df.select_dtypes(include=['number']).columns)
        categorical = len(df.select_dtypes(include=['object']).columns)
        
        # Check for target
        has_target = False
        for col in df.columns:
            if any(p in col.lower() for p in self.TARGET_PATTERNS):
                has_target = True
                break
        
        return {
            'total': len(df.columns),
            'numeric': numeric,
            'categorical': categorical,
            'rows': len(df),
            'has_target': has_target
        }


def validate_dataset(file_path: str, verbose: bool = True) -> ValidationReport:
    """
    Quick validation function.
    
    Args:
        file_path: Path to CSV file
        verbose: Print summary if True
        
    Returns:
        ValidationReport
    """
    validator = DatasetValidator()
    report = validator.validate(file_path)
    
    if verbose:
        print(report.get_summary())
    
    return report
