"""
Configuration for Adaptive Churn Prediction System

Stores API keys and system defaults.
Supports multiple API keys with automatic load balancing.
"""

import os

# LLM Configuration - Multiple API Keys for Load Balancing
# The system will automatically rotate between keys when one hits quota limits

# Gemini API Keys (rotate between these — set via environment variables)
GEMINI_API_KEYS = [
    key for key in [
        os.getenv("GEMINI_API_KEY_1"),
        os.getenv("GEMINI_API_KEY_2"),
        os.getenv("GEMINI_API_KEY_3"),
        os.getenv("GEMINI_API_KEY_4"),
    ] if key
]

# OpenAI API Keys (set via environment variables)
OPENAI_API_KEYS = [
    key for key in [os.getenv("OPENAI_API_KEY")] if key
]

# Legacy single-key access (for backwards compatibility)
GEMINI_API_KEY = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else None
OPENAI_API_KEY = OPENAI_API_KEYS[0] if OPENAI_API_KEYS else None

# Default LLM provider: "gemini" or "openai"
DEFAULT_LLM_PROVIDER = "gemini"

# Whether to use LLM by default for column detection
USE_LLM_BY_DEFAULT = True

# Model defaults
DEFAULT_MODEL_TYPE = "random_forest"

# Paths
import pathlib
PROJECT_ROOT = pathlib.Path(__file__).parent.parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DATA_DIR = PROJECT_ROOT / "data"
