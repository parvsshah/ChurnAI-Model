"""
Schema Configuration for Adaptive Churn Prediction System

Defines abstract column types that any dataset should provide.
The system uses semantic understanding to map actual column names to these types.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum


class ColumnType(Enum):
    """Abstract column types for churn prediction"""
    ID = "id"                       # Unique identifier
    TARGET = "target"               # Churn label (0/1 or Yes/No)
    TENURE = "tenure"               # Customer relationship length
    COST_MONTHLY = "cost_monthly"   # Recurring charges
    COST_TOTAL = "cost_total"       # Cumulative charges
    CONTRACT = "contract"           # Commitment type
    CATEGORICAL = "categorical"     # Service/feature categories
    BINARY = "binary"               # Yes/No features
    NUMERIC = "numeric"             # Other numeric features


@dataclass
class ColumnSchema:
    """Schema definition for a column type"""
    column_type: ColumnType
    required: bool = True
    description: str = ""
    keywords: List[str] = field(default_factory=list)  # For semantic matching
    value_hints: List[str] = field(default_factory=list)  # Expected values


# Default schema for churn prediction
DEFAULT_SCHEMA: Dict[ColumnType, ColumnSchema] = {
    ColumnType.ID: ColumnSchema(
        column_type=ColumnType.ID,
        required=False,
        description="Unique customer identifier",
        keywords=["id", "customer_id", "customerid", "user_id", "userid", "account"],
    ),
    ColumnType.TARGET: ColumnSchema(
        column_type=ColumnType.TARGET,
        required=True,
        description="Churn indicator (target variable)",
        keywords=["churn", "churned", "cancelled", "left", "attrition", "exit", "target"],
        value_hints=["yes", "no", "0", "1", "true", "false"],
    ),
    ColumnType.TENURE: ColumnSchema(
        column_type=ColumnType.TENURE,
        required=True,
        description="Duration of customer relationship",
        keywords=["tenure", "months", "duration", "time", "age", "lifetime", "subscription_length"],
    ),
    ColumnType.COST_MONTHLY: ColumnSchema(
        column_type=ColumnType.COST_MONTHLY,
        required=False,
        description="Monthly/recurring charges",
        keywords=["monthly", "charge", "fee", "price", "cost", "mrr", "recurring"],
    ),
    ColumnType.COST_TOTAL: ColumnSchema(
        column_type=ColumnType.COST_TOTAL,
        required=False,
        description="Total cumulative charges",
        keywords=["total", "cumulative", "lifetime_value", "ltv", "revenue"],
    ),
    ColumnType.CONTRACT: ColumnSchema(
        column_type=ColumnType.CONTRACT,
        required=False,
        description="Contract/commitment type",
        keywords=["contract", "plan", "subscription", "commitment", "term"],
        value_hints=["month-to-month", "one year", "two year", "annual", "monthly"],
    ),
}


# Semantic keywords for auto-detection
SEMANTIC_KEYWORDS = {
    # Service-related
    "service": ["service", "product", "feature", "addon", "add_on"],
    "internet": ["internet", "broadband", "fiber", "dsl", "online"],
    "phone": ["phone", "call", "mobile", "voice", "telephone"],
    "streaming": ["streaming", "tv", "movie", "video", "entertainment"],
    "security": ["security", "protection", "backup", "support", "tech"],
    
    # Demographics
    "gender": ["gender", "sex"],
    "age": ["age", "senior", "elderly", "young"],
    "family": ["partner", "dependent", "family", "married", "spouse", "children"],
    
    # Payment
    "payment": ["payment", "billing", "invoice", "method", "autopay"],
    "paperless": ["paperless", "electronic", "email", "digital"],
}


# Generic churn signals (domain-agnostic)
CHURN_SIGNALS = {
    "high_cost": {
        "description": "Customer's cost is above the 75th percentile",
        "column_types": [ColumnType.COST_MONTHLY, ColumnType.COST_TOTAL],
        "threshold_percentile": 75,
        "risk_level": "medium",
    },
    "low_tenure": {
        "description": "Customer tenure is below the 25th percentile",
        "column_types": [ColumnType.TENURE],
        "threshold_percentile": 25,
        "risk_level": "high",
    },
    "no_commitment": {
        "description": "Customer has no long-term commitment",
        "column_types": [ColumnType.CONTRACT],
        "low_commitment_values": ["month-to-month", "monthly", "none", "no contract"],
        "risk_level": "high",
    },
    "high_churn_probability": {
        "description": "Model predicts high churn probability",
        "threshold": 0.7,
        "risk_level": "critical",
    },
}


# Action templates for recommendations
ACTION_TEMPLATES = {
    "high_cost": [
        "Consider offering a {discount_pct}% discount on monthly charges",
        "Propose a bundled package with better value",
        "Review pricing tier alignment with usage patterns",
    ],
    "low_tenure": [
        "Initiate early engagement program",
        "Assign dedicated customer success representative",
        "Offer first-year loyalty bonus",
    ],
    "no_commitment": [
        "Promote benefits of annual subscription",
        "Offer incentive for contract upgrade",
        "Highlight long-term savings potential",
    ],
    "high_churn_probability": [
        "Immediate intervention required",
        "Schedule personal outreach call",
        "Offer retention package",
    ],
    "missing_features": [
        "Recommend value-added services: {missing_services}",
        "Offer trial period for additional features",
    ],
}
