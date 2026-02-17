"""
Column Mapper with LLM Integration for Semantic Understanding

Provides both automatic and manual column mapping capabilities.
Uses LLM by default for intelligent column type detection.
"""

import pandas as pd
import numpy as np
import os
import json
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
import re

# Try to import LLM libraries (optional)
try:
    from google import genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.schema_config import ColumnType, DEFAULT_SCHEMA, SEMANTIC_KEYWORDS

# Import settings for default configuration
try:
    from config.settings import GEMINI_API_KEY, OPENAI_API_KEY, DEFAULT_LLM_PROVIDER, USE_LLM_BY_DEFAULT
except ImportError:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_LLM_PROVIDER = "gemini"
    USE_LLM_BY_DEFAULT = False


@dataclass
class ColumnMapping:
    """Represents a mapping from source column to abstract type"""
    source_column: str
    target_type: ColumnType
    confidence: float  # 0.0 to 1.0
    detection_method: str  # "keyword", "llm", "manual", "type_inference"
    notes: str = ""


@dataclass
class MappingResult:
    """Result of column mapping operation"""
    mappings: Dict[str, ColumnMapping] = field(default_factory=dict)
    unmapped_columns: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    llm_insights: Optional[str] = None


class ColumnMapper:
    """
    Adaptive column mapper with multiple detection strategies.
    
    Supports:
    1. Keyword-based matching
    2. Data type inference
    3. LLM-powered semantic understanding (enabled by default)
    4. Manual override
    """
    
    def __init__(self, llm_provider: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize the column mapper.
        
        Args:
            llm_provider: "gemini", "openai", or None. Defaults to settings.
            api_key: API key for LLM provider. Defaults to settings.
        """
        # Use settings defaults if not provided
        self.llm_provider = llm_provider or DEFAULT_LLM_PROVIDER
        self.api_key = api_key or GEMINI_API_KEY or OPENAI_API_KEY
        self._setup_llm()
    
    def _setup_llm(self):
        """Configure LLM if available"""
        self.llm_available = False
        
        if self.llm_provider == "gemini" and HAS_GEMINI and self.api_key:
            self.gemini_client = genai.Client(api_key=self.api_key)
            self.llm_available = True
        elif self.llm_provider == "openai" and HAS_OPENAI and self.api_key:
            openai.api_key = self.api_key
            self.llm_available = True
    
    def map_columns(
        self,
        df: pd.DataFrame,
        mode: str = "auto",
        manual_mappings: Optional[Dict[str, str]] = None,
        use_llm: bool = True
    ) -> MappingResult:
        """
        Map DataFrame columns to abstract column types.
        
        Args:
            df: Input DataFrame
            mode: "auto", "manual", or "hybrid"
            manual_mappings: Dict of {column_name: column_type_name} for manual mode
            use_llm: Whether to use LLM for semantic understanding
            
        Returns:
            MappingResult with all mappings and insights
        """
        result = MappingResult()
        
        if mode == "manual" and manual_mappings:
            result = self._apply_manual_mappings(df, manual_mappings)
        elif mode == "auto":
            result = self._auto_detect_mappings(df, use_llm)
        else:  # hybrid
            result = self._auto_detect_mappings(df, use_llm)
            if manual_mappings:
                result = self._merge_manual_mappings(result, manual_mappings)
        
        # Find unmapped columns
        mapped_cols = set(result.mappings.keys())
        result.unmapped_columns = [col for col in df.columns if col not in mapped_cols]
        
        return result
    
    def _auto_detect_mappings(self, df: pd.DataFrame, use_llm: bool) -> MappingResult:
        """Automatic column type detection"""
        result = MappingResult()
        
        for col in df.columns:
            # Try keyword matching first
            mapping = self._keyword_match(col, df[col])
            
            if mapping is None:
                # Try type inference
                mapping = self._type_inference(col, df[col])
            
            if mapping:
                result.mappings[col] = mapping
        
        # Use LLM for deeper understanding if available
        if use_llm and self.llm_available:
            llm_result = self._llm_analyze(df, result)
            result.llm_insights = llm_result.get("insights")
            
            # Update mappings with LLM suggestions
            for col, suggested_type in llm_result.get("suggestions", {}).items():
                if col not in result.mappings or result.mappings[col].confidence < 0.8:
                    try:
                        col_type = ColumnType(suggested_type)
                        result.mappings[col] = ColumnMapping(
                            source_column=col,
                            target_type=col_type,
                            confidence=0.85,
                            detection_method="llm",
                            notes="Detected by LLM semantic analysis"
                        )
                    except ValueError:
                        pass
        
        return result
    
    def _keyword_match(self, column_name: str, series: pd.Series) -> Optional[ColumnMapping]:
        """Match column name against known keywords"""
        col_lower = column_name.lower().replace("_", " ").replace("-", " ")
        
        best_match = None
        best_score = 0.0
        
        for col_type, schema in DEFAULT_SCHEMA.items():
            for keyword in schema.keywords:
                if keyword in col_lower or col_lower in keyword:
                    # Calculate match score
                    score = len(keyword) / max(len(col_lower), len(keyword))
                    if keyword == col_lower:
                        score = 1.0
                    
                    if score > best_score:
                        best_score = score
                        best_match = ColumnMapping(
                            source_column=column_name,
                            target_type=col_type,
                            confidence=min(score, 0.95),
                            detection_method="keyword",
                            notes=f"Matched keyword: {keyword}"
                        )
        
        # Only use value hints for TARGET detection if column name suggests it
        # This prevents Yes/No binary columns from being misclassified as target
        if best_match is None:
            target_keywords = ["churn", "churned", "cancelled", "left", "attrition", "exit", "target", "label"]
            is_target_candidate = any(kw in col_lower for kw in target_keywords)
            
            if is_target_candidate:
                unique_vals = series.dropna().astype(str).str.lower().unique()
                target_schema = DEFAULT_SCHEMA.get(ColumnType.TARGET)
                if target_schema and target_schema.value_hints:
                    matches = sum(1 for v in unique_vals if v in target_schema.value_hints)
                    if matches >= len(unique_vals) * 0.5:
                        return ColumnMapping(
                            source_column=column_name,
                            target_type=ColumnType.TARGET,
                            confidence=0.85,
                            detection_method="value_hint",
                            notes="Values and name match target pattern"
                        )
        
        return best_match
    
    def _type_inference(self, column_name: str, series: pd.Series) -> Optional[ColumnMapping]:
        """Infer column type from data characteristics"""
        # Check if binary
        unique_vals = series.dropna().unique()
        if len(unique_vals) <= 3:
            str_vals = set(str(v).lower() for v in unique_vals)
            binary_patterns = [
                {"yes", "no"}, {"0", "1"}, {"true", "false"},
                {"y", "n"}, {"1", "0"}, {"yes", "no", ""}
            ]
            for pattern in binary_patterns:
                if str_vals.issubset(pattern):
                    return ColumnMapping(
                        source_column=column_name,
                        target_type=ColumnType.BINARY,
                        confidence=0.8,
                        detection_method="type_inference",
                        notes="Binary values detected"
                    )
        
        # Check if numeric
        if pd.api.types.is_numeric_dtype(series):
            # Could be cost, tenure, or generic numeric
            if series.min() >= 0:
                col_lower = column_name.lower()
                if any(k in col_lower for k in ["charge", "price", "cost", "amount", "fee"]):
                    return ColumnMapping(
                        source_column=column_name,
                        target_type=ColumnType.COST_MONTHLY,
                        confidence=0.6,
                        detection_method="type_inference",
                        notes="Numeric with cost-related name"
                    )
                return ColumnMapping(
                    source_column=column_name,
                    target_type=ColumnType.NUMERIC,
                    confidence=0.5,
                    detection_method="type_inference",
                    notes="Generic numeric column"
                )
        
        # Check if categorical
        if len(unique_vals) < 20 and len(unique_vals) > 2:
            return ColumnMapping(
                source_column=column_name,
                target_type=ColumnType.CATEGORICAL,
                confidence=0.5,
                detection_method="type_inference",
                notes=f"Categorical with {len(unique_vals)} unique values"
            )
        
        return None
    
    def _llm_analyze(self, df: pd.DataFrame, current_result: MappingResult) -> Dict[str, Any]:
        """Use LLM for semantic analysis of columns"""
        if not self.llm_available:
            return {}
        
        # Prepare column summary for LLM
        column_info = []
        for col in df.columns:
            sample = df[col].dropna().head(5).tolist()
            dtype = str(df[col].dtype)
            unique_count = df[col].nunique()
            column_info.append({
                "name": col,
                "dtype": dtype,
                "unique_values": unique_count,
                "sample": sample[:5]
            })
        
        prompt = f"""Analyze these dataset columns for a churn prediction system.
        
Columns:
{json.dumps(column_info, indent=2, default=str)}

For each column, suggest one of these types:
- id: Unique identifier
- target: Churn label (the thing we're predicting)
- tenure: Customer duration/relationship length
- cost_monthly: Monthly/recurring charges
- cost_total: Total/cumulative charges
- contract: Commitment/subscription type
- categorical: Service or feature category
- binary: Yes/No feature
- numeric: Other numeric value

Respond in JSON format:
{{
    "suggestions": {{"column_name": "type", ...}},
    "insights": "Brief description of the dataset domain and key churn indicators"
}}
"""
        
        try:
            if self.llm_provider == "gemini":
                response = self.gemini_client.models.generate_content(
                    model='gemini-2.0-flash', contents=prompt
                )
                text = response.text
            elif self.llm_provider == "openai":
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}]
                )
                text = response.choices[0].message.content
            
            # Parse JSON from response
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            return {"error": str(e)}
        
        return {}
    
    def _apply_manual_mappings(
        self, 
        df: pd.DataFrame, 
        manual_mappings: Dict[str, str]
    ) -> MappingResult:
        """Apply user-provided manual mappings"""
        result = MappingResult()
        
        for col_name, type_name in manual_mappings.items():
            if col_name in df.columns:
                try:
                    col_type = ColumnType(type_name)
                    result.mappings[col_name] = ColumnMapping(
                        source_column=col_name,
                        target_type=col_type,
                        confidence=1.0,
                        detection_method="manual",
                        notes="User-provided mapping"
                    )
                except ValueError:
                    result.warnings.append(f"Unknown type '{type_name}' for column '{col_name}'")
            else:
                result.warnings.append(f"Column '{col_name}' not found in dataset")
        
        return result
    
    def _merge_manual_mappings(
        self, 
        auto_result: MappingResult, 
        manual_mappings: Dict[str, str]
    ) -> MappingResult:
        """Merge manual mappings with auto-detected ones (manual takes priority)"""
        for col_name, type_name in manual_mappings.items():
            try:
                col_type = ColumnType(type_name)
                auto_result.mappings[col_name] = ColumnMapping(
                    source_column=col_name,
                    target_type=col_type,
                    confidence=1.0,
                    detection_method="manual",
                    notes="User override"
                )
            except ValueError:
                auto_result.warnings.append(f"Unknown type '{type_name}' for column '{col_name}'")
        
        return auto_result
    
    def get_interactive_mapping(self, df: pd.DataFrame) -> MappingResult:
        """Interactive CLI for manual column mapping"""
        print("\n" + "="*60)
        print("INTERACTIVE COLUMN MAPPING")
        print("="*60)
        
        # First, show auto-detected mappings
        auto_result = self._auto_detect_mappings(df, use_llm=False)
        
        print("\nAuto-detected mappings:")
        for col, mapping in auto_result.mappings.items():
            print(f"  {col} → {mapping.target_type.value} (confidence: {mapping.confidence:.2f})")
        
        print("\nUnmapped columns:")
        for col in auto_result.unmapped_columns:
            sample = df[col].dropna().head(3).tolist()
            print(f"  {col}: {sample}")
        
        print("\nAvailable types:", [t.value for t in ColumnType])
        print("\nEnter mappings (format: column_name=type), or press Enter to accept auto-detected:")
        print("Type 'done' when finished, 'skip' to use auto-detected only\n")
        
        manual_mappings = {}
        while True:
            user_input = input("> ").strip()
            if user_input.lower() == "done":
                break
            if user_input.lower() == "skip":
                return auto_result
            if "=" in user_input:
                parts = user_input.split("=")
                if len(parts) == 2:
                    col_name, type_name = parts[0].strip(), parts[1].strip()
                    manual_mappings[col_name] = type_name
                    print(f"  Added: {col_name} → {type_name}")
        
        return self._merge_manual_mappings(auto_result, manual_mappings)
    
    def to_dict(self, result: MappingResult) -> Dict[str, str]:
        """Convert MappingResult to simple dict for preprocessing"""
        return {col: mapping.target_type.value for col, mapping in result.mappings.items()}
    
    def get_columns_by_type(self, result: MappingResult, col_type: ColumnType) -> List[str]:
        """Get all columns mapped to a specific type"""
        return [col for col, mapping in result.mappings.items() 
                if mapping.target_type == col_type]
