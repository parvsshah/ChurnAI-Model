"""
Adaptive Preprocessor for Churn Prediction

Creates sklearn preprocessing pipelines dynamically based on
semantic column mappings. Works with any dataset structure.
"""

import pandas as pd
import numpy as np
import joblib
import os
import sys
from typing import Dict, List, Optional, Tuple, Any
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.schema_config import ColumnType
from mappers.column_mapper import MappingResult


class AdaptivePreprocessor:
    """
    Dynamic preprocessing pipeline that adapts to any dataset.
    
    Uses semantic column mappings to build appropriate transformers.
    """
    
    def __init__(self):
        self.pipeline: Optional[ColumnTransformer] = None
        self.label_encoder: Optional[LabelEncoder] = None
        self.mapping_result: Optional[MappingResult] = None
        self.feature_columns: List[str] = []
        self.target_column: Optional[str] = None
        self._is_fitted = False
    
    def build_pipeline(self, df: pd.DataFrame, mapping_result: MappingResult) -> ColumnTransformer:
        """
        Build preprocessing pipeline based on column mappings.
        
        Args:
            df: DataFrame to analyze for transformers
            mapping_result: Semantic column mappings
            
        Returns:
            ColumnTransformer ready for fitting
        """
        self.mapping_result = mapping_result
        
        # Categorize columns by processing type
        numeric_cols = []
        categorical_cols = []
        binary_cols = []
        
        for col, mapping in mapping_result.mappings.items():
            if mapping.target_type == ColumnType.TARGET:
                self.target_column = col
                continue
            elif mapping.target_type == ColumnType.ID:
                continue  # Skip ID columns
            elif mapping.target_type in [ColumnType.TENURE, ColumnType.COST_MONTHLY, 
                                          ColumnType.COST_TOTAL, ColumnType.NUMERIC]:
                numeric_cols.append(col)
            elif mapping.target_type == ColumnType.BINARY:
                # Check actual dtype - if numeric, treat as numeric
                if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                    numeric_cols.append(col)
                else:
                    binary_cols.append(col)
            elif mapping.target_type in [ColumnType.CATEGORICAL, ColumnType.CONTRACT]:
                # Check actual dtype - if numeric (int/float), treat as numeric
                if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                    numeric_cols.append(col)
                else:
                    categorical_cols.append(col)
        
        # Also process unmapped columns based on dtype
        for col in mapping_result.unmapped_columns:
            if col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    numeric_cols.append(col)
                elif df[col].nunique() <= 2:
                    binary_cols.append(col)
                elif df[col].nunique() <= 10:
                    categorical_cols.append(col)
        
        self.feature_columns = numeric_cols + categorical_cols + binary_cols
        
        # Build transformers
        transformers = []
        
        if numeric_cols:
            numeric_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            transformers.append(('numeric', numeric_transformer, numeric_cols))
        
        if categorical_cols:
            categorical_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
                ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('categorical', categorical_transformer, categorical_cols))
        
        if binary_cols:
            binary_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False, drop='if_binary'))
            ])
            transformers.append(('binary', binary_transformer, binary_cols))
        
        self.pipeline = ColumnTransformer(
            transformers=transformers,
            remainder='drop',
            verbose_feature_names_out=False
        )
        
        return self.pipeline
    
    def fit(self, df: pd.DataFrame, mapping_result: Optional[MappingResult] = None):
        """
        Fit the preprocessor on training data.
        
        Args:
            df: Training DataFrame
            mapping_result: Semantic column mappings
        """
        if mapping_result:
            self.build_pipeline(df, mapping_result)
        elif self.pipeline is None:
            raise ValueError("Must provide mapping_result or call build_pipeline first")
        
        # Prepare features - make a copy to avoid modifying original
        df_clean = df[self.feature_columns].copy()
        
        # Clean numeric columns - convert string numerics to proper dtype
        numeric_types = [ColumnType.TENURE, ColumnType.COST_MONTHLY, 
                        ColumnType.COST_TOTAL, ColumnType.NUMERIC]
        for col in self.feature_columns:
            if col in self.mapping_result.mappings:
                if self.mapping_result.mappings[col].target_type in numeric_types:
                    if not pd.api.types.is_numeric_dtype(df_clean[col]):
                        # Convert to numeric, coercing errors to NaN
                        df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
        
        # Store the numeric conversion info for transform
        self._numeric_cols_to_convert = [
            col for col in self.feature_columns 
            if col in self.mapping_result.mappings 
            and self.mapping_result.mappings[col].target_type in numeric_types
        ]
        
        # Fit pipeline
        self.pipeline.fit(df_clean)
        
        # Fit label encoder for target
        if self.target_column and self.target_column in df.columns:
            self.label_encoder = LabelEncoder()
            self.label_encoder.fit(df[self.target_column].astype(str))
        
        self._is_fitted = True
        return self
    
    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """
        Transform data using fitted pipeline.
        
        Args:
            df: DataFrame to transform
            
        Returns:
            Transformed feature array
        """
        if not self._is_fitted:
            raise ValueError("Preprocessor not fitted. Call fit() first.")
        
        # Make a copy to avoid modifying original
        df_clean = df.copy()
        
        # Ensure all required columns exist
        missing_cols = set(self.feature_columns) - set(df_clean.columns)
        if missing_cols:
            for col in missing_cols:
                df_clean[col] = np.nan
        
        # Clean ALL potentially numeric columns - handle spaces and empty strings
        for col in self.feature_columns:
            if col in df_clean.columns:
                # Check if column might be numeric but has malformed values
                if df_clean[col].dtype == 'object':
                    # Replace empty strings and whitespace-only strings with NaN
                    df_clean[col] = df_clean[col].replace(r'^\s*$', np.nan, regex=True)
                    # Try to convert to numeric (coerces non-numeric to NaN)
                    numeric_attempt = pd.to_numeric(df_clean[col], errors='coerce')
                    # If most values converted successfully, use the numeric version
                    if numeric_attempt.notna().sum() > len(df_clean) * 0.5:
                        df_clean[col] = numeric_attempt
        
        # Convert specific numeric columns if marked during fitting
        if hasattr(self, '_numeric_cols_to_convert'):
            for col in self._numeric_cols_to_convert:
                if col in df_clean.columns and not pd.api.types.is_numeric_dtype(df_clean[col]):
                    df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
        
        X = df_clean[self.feature_columns]
        return self.pipeline.transform(X)
    
    def fit_transform(self, df: pd.DataFrame, mapping_result: Optional[MappingResult] = None) -> np.ndarray:
        """Fit and transform in one step"""
        self.fit(df, mapping_result)
        return self.transform(df)
    
    def transform_target(self, y: pd.Series) -> np.ndarray:
        """Transform target variable to numeric"""
        if self.label_encoder is None:
            raise ValueError("Label encoder not fitted")
        return self.label_encoder.transform(y.astype(str))
    
    def inverse_transform_target(self, y: np.ndarray) -> np.ndarray:
        """Convert numeric predictions back to original labels"""
        if self.label_encoder is None:
            raise ValueError("Label encoder not fitted")
        return self.label_encoder.inverse_transform(y)
    
    def get_feature_names(self) -> List[str]:
        """Get feature names after transformation"""
        if not self._is_fitted:
            raise ValueError("Preprocessor not fitted")
        try:
            return list(self.pipeline.get_feature_names_out())
        except:
            return self.feature_columns
    
    def save(self, path: str):
        """Save preprocessor to disk"""
        save_dict = {
            'pipeline': self.pipeline,
            'label_encoder': self.label_encoder,
            'feature_columns': self.feature_columns,
            'target_column': self.target_column,
            'mapping_result': self.mapping_result,
            '_is_fitted': self._is_fitted
        }
        joblib.dump(save_dict, path)
    
    @classmethod
    def load(cls, path: str) -> 'AdaptivePreprocessor':
        """Load preprocessor from disk"""
        save_dict = joblib.load(path)
        instance = cls()
        instance.pipeline = save_dict['pipeline']
        instance.label_encoder = save_dict['label_encoder']
        instance.feature_columns = save_dict['feature_columns']
        instance.target_column = save_dict['target_column']
        instance.mapping_result = save_dict['mapping_result']
        instance._is_fitted = save_dict['_is_fitted']
        return instance
    
    def get_column_summary(self) -> Dict[str, Any]:
        """Get summary of column processing"""
        numeric = []
        categorical = []
        binary = []
        
        if self.mapping_result:
            for col in self.feature_columns:
                if col in self.mapping_result.mappings:
                    t = self.mapping_result.mappings[col].target_type
                    if t in [ColumnType.TENURE, ColumnType.COST_MONTHLY, 
                            ColumnType.COST_TOTAL, ColumnType.NUMERIC]:
                        numeric.append(col)
                    elif t == ColumnType.BINARY:
                        binary.append(col)
                    else:
                        categorical.append(col)
        
        return {
            'numeric_columns': numeric,
            'categorical_columns': categorical,
            'binary_columns': binary,
            'target_column': self.target_column,
            'total_features': len(self.feature_columns)
        }
