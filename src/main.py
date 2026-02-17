"""
Main Entry Point for Adaptive Churn Prediction System

Provides unified CLI interface for training, prediction, and recommendations.
Supports any dataset format with semantic column mapping.
"""

import argparse
import pandas as pd
import numpy as np
import os
import sys
import json
from typing import Optional

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.schema_config import ColumnType
from config.settings import USE_LLM_BY_DEFAULT, DEFAULT_LLM_PROVIDER
from mappers.column_mapper import ColumnMapper, MappingResult
from validators.schema_validator import SchemaValidator, ValidationResult
from pipeline.preprocessor import AdaptivePreprocessor
from pipeline.model_pipeline import ModelPipeline
from recommender.recommender import RecommendationEngine


# Default paths
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "adaptive_model.pkl")
DEFAULT_PREPROCESSOR_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "adaptive_preprocessor.pkl")


def validate_dataset(
    data_path: str,
    use_llm: bool = USE_LLM_BY_DEFAULT,
    llm_provider: Optional[str] = DEFAULT_LLM_PROVIDER
) -> ValidationResult:
    """Validate a dataset for churn prediction compatibility."""
    print(f"\n📂 Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Shape: {df.shape}")
    
    # Initialize column mapper (uses LLM by default from settings)
    mapper = ColumnMapper(llm_provider=llm_provider if use_llm else None)
    
    # Validate
    validator = SchemaValidator(mapper)
    result = validator.validate(df)
    
    # Print report
    print(validator.get_validation_report(result))
    
    return result


def train_model(
    data_path: str,
    model_type: str = "random_forest",
    mapping_mode: str = "auto",
    use_llm: bool = USE_LLM_BY_DEFAULT,
    llm_provider: Optional[str] = DEFAULT_LLM_PROVIDER,
    output_model: Optional[str] = None,
    output_preprocessor: Optional[str] = None
):
    """Train a churn prediction model on provided data."""
    print("\n" + "=" * 60)
    print("🚀 ADAPTIVE CHURN MODEL TRAINING" + (" (with AI)" if use_llm else ""))
    print("=" * 60)
    
    # Load data
    print(f"\n📂 Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Shape: {df.shape}")
    
    # Column mapping (uses LLM by default from settings)
    print("\n🔍 Detecting column types" + (" with AI..." if use_llm else "..."))
    mapper = ColumnMapper(llm_provider=llm_provider if use_llm else None)
    
    if mapping_mode == "interactive":
        mapping_result = mapper.get_interactive_mapping(df)
    else:
        mapping_result = mapper.map_columns(df, mode="auto", use_llm=use_llm)
    
    print("\n📊 Column Mappings:")
    for col, m in mapping_result.mappings.items():
        print(f"   {col} → {m.target_type.value} ({m.detection_method}, {m.confidence:.0%})")
    
    if mapping_result.llm_insights:
        print(f"\n🤖 AI Insights: {mapping_result.llm_insights}")
    
    # Validate
    print("\n✅ Validating dataset...")
    validator = SchemaValidator(mapper)
    validation = validator.validate(df, mapping_result)
    
    if not validation.is_valid:
        print("\n❌ Validation failed:")
        for err in validation.errors:
            print(f"   • {err}")
        return
    
    if validation.warnings:
        print("\n⚠️ Warnings:")
        for warn in validation.warnings[:5]:
            print(f"   • {warn}")
    
    # Train model
    print(f"\n🎯 Training {model_type} model...")
    pipeline = ModelPipeline(model_type=model_type, column_mapper=mapper)
    result = pipeline.train(df, mapping_result)
    
    print(pipeline.get_training_report())
    
    # Save model
    model_path = output_model or DEFAULT_MODEL_PATH
    preprocessor_path = output_preprocessor or DEFAULT_PREPROCESSOR_PATH
    
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    pipeline.save(model_path, preprocessor_path)
    
    print(f"\n💾 Model saved to: {model_path}")
    print(f"   Preprocessor saved to: {preprocessor_path}")
    
    return pipeline


def predict(
    data_path: str,
    output_path: str,
    model_path: Optional[str] = None,
    preprocessor_path: Optional[str] = None,
    include_recommendations: bool = True,
    threshold: float = 0.5
):
    """Make predictions with recommendations on new data."""
    print("\n" + "=" * 60)
    print("🎯 CHURN PREDICTION WITH RECOMMENDATIONS")
    print("=" * 60)
    
    # Load model
    model_path = model_path or DEFAULT_MODEL_PATH
    preprocessor_path = preprocessor_path or DEFAULT_PREPROCESSOR_PATH
    
    print(f"\n📦 Loading model from: {model_path}")
    pipeline = ModelPipeline.load(model_path, preprocessor_path)
    
    # Load data
    print(f"\n📂 Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Shape: {df.shape}")
    
    # Make predictions
    print("\n🔮 Making predictions...")
    pred_result = pipeline.predict(df, threshold=threshold)
    
    # Prepare output
    output_df = df.copy()
    output_df["Churn_Probability"] = pred_result.probabilities
    output_df["Churn_Prediction"] = pred_result.prediction_labels
    
    # Generate recommendations
    if include_recommendations:
        print("\n💡 Generating recommendations...")
        rec_engine = RecommendationEngine(pipeline.mapping_result, use_llm=True)
        rec_engine.fit(df, pipeline.mapping_result)
        
        recommendations = rec_engine.recommend_batch(
            df,
            churn_probabilities=pred_result.probabilities,
            churn_predictions=pred_result.prediction_labels
        )
        
        # Add recommendation columns
        rec_df = rec_engine.to_dataframe(recommendations)
        output_df["Risk_Level"] = rec_df["risk_level"]
        output_df["Churn_Signals"] = rec_df["churn_signals"]
        output_df["Recommendations"] = rec_df["recommendations"]
        
        # Print summary
        stats = rec_engine.get_summary_statistics(recommendations)
        print("\n📊 Summary Statistics:")
        print(f"   Total Customers: {stats['total_customers']}")
        print(f"   High Risk Count: {stats['high_risk_count']}")
        print(f"   Avg Churn Probability: {stats['avg_churn_probability']:.2%}")
        print(f"   Customers >70% Risk: {stats['customers_above_70pct']}")
        
        print("\n📈 Risk Distribution:")
        for level, pct in stats['risk_percentages'].items():
            print(f"   {level.capitalize()}: {pct}")
        
        # Try to generate AI-enhanced report
        ai_report = rec_engine.get_ai_enhanced_report(df, recommendations)
        if ai_report and rec_engine.llm_engine and rec_engine.llm_engine.available:
            print("\n" + ai_report)
        else:
            # Fallback to standard high-risk report
            print(rec_engine.get_high_risk_report(recommendations))
    
    # Save output
    output_df.to_csv(output_path, index=False)
    print(f"\n💾 Predictions saved to: {output_path}")
    
    # Summary
    churn_count = (output_df["Churn_Prediction"] == "Yes").sum()
    print(f"\n📋 Prediction Summary:")
    print(f"   Predicted to Churn: {churn_count} ({churn_count/len(df)*100:.1f}%)")
    print(f"   Predicted to Stay:  {len(df)-churn_count} ({(len(df)-churn_count)/len(df)*100:.1f}%)")
    
    return output_df


def main():
    parser = argparse.ArgumentParser(
        description="Adaptive Churn Prediction System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Validate a dataset
  python main.py validate --data path/to/data.csv
  
  # Train a model
  python main.py train --data path/to/data.csv --model random_forest
  
  # Train with interactive column mapping
  python main.py train --data path/to/data.csv --mapping interactive
  
  # Train with LLM assistance (requires API key)
  python main.py train --data path/to/data.csv --use-llm --llm-provider gemini
  
  # Make predictions
  python main.py predict --data path/to/new_data.csv --output predictions.csv
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate a dataset")
    validate_parser.add_argument("--data", required=True, help="Path to CSV data file")
    validate_parser.add_argument("--use-llm", action="store_true", help="Use LLM for column detection")
    validate_parser.add_argument("--llm-provider", default="gemini", help="LLM provider (gemini/openai)")
    
    # Train command
    train_parser = subparsers.add_parser("train", help="Train a churn prediction model")
    train_parser.add_argument("--data", required=True, help="Path to CSV training data")
    train_parser.add_argument("--model", default="random_forest", 
                             choices=["random_forest", "gradient_boosting", "logistic_regression"],
                             help="Model type to train")
    train_parser.add_argument("--mapping", default="auto", choices=["auto", "interactive"],
                             help="Column mapping mode")
    train_parser.add_argument("--use-llm", action="store_true", help="Use LLM for column detection")
    train_parser.add_argument("--llm-provider", default="gemini", help="LLM provider (gemini/openai)")
    train_parser.add_argument("--output-model", help="Path to save model")
    train_parser.add_argument("--output-preprocessor", help="Path to save preprocessor")
    
    # Predict command
    predict_parser = subparsers.add_parser("predict", help="Make predictions on new data")
    predict_parser.add_argument("--data", required=True, help="Path to CSV data for prediction")
    predict_parser.add_argument("--output", required=True, help="Path for output CSV")
    predict_parser.add_argument("--model", help="Path to trained model")
    predict_parser.add_argument("--preprocessor", help="Path to preprocessor")
    predict_parser.add_argument("--no-recommendations", action="store_true",
                               help="Skip recommendation generation")
    predict_parser.add_argument("--threshold", type=float, default=0.5,
                               help="Probability threshold for positive prediction")
    
    # Smart command - auto-detects train vs predict
    smart_parser = subparsers.add_parser("smart", help="Smart processing - auto-detects train vs predict")
    smart_parser.add_argument("--data", required=True, help="Path to CSV data")
    smart_parser.add_argument("--output", help="Path for output predictions (optional)")
    smart_parser.add_argument("--force-train", action="store_true", help="Force training new model")
    smart_parser.add_argument("--force-predict", action="store_true", help="Force prediction mode")
    
    # Check command - validate dataset before processing
    check_parser = subparsers.add_parser("check", help="Check if dataset is compatible before processing")
    check_parser.add_argument("--data", required=True, help="Path to CSV data to validate")
    
    args = parser.parse_args()
    
    if args.command == "validate":
        validate_dataset(
            args.data,
            use_llm=args.use_llm,
            llm_provider=args.llm_provider
        )
    elif args.command == "train":
        train_model(
            args.data,
            model_type=args.model,
            mapping_mode=args.mapping,
            use_llm=args.use_llm,
            llm_provider=args.llm_provider,
            output_model=args.output_model,
            output_preprocessor=args.output_preprocessor
        )
    elif args.command == "predict":
        predict(
            args.data,
            args.output,
            model_path=args.model,
            preprocessor_path=args.preprocessor,
            include_recommendations=not args.no_recommendations,
            threshold=args.threshold
        )
    elif args.command == "smart":
        from pipeline.smart_pipeline import smart_process, SmartPipeline
        import pandas as pd
        df = pd.read_csv(args.data)
        pipeline = SmartPipeline()
        result = pipeline.run(
            df, 
            output_path=args.output,
            force_train=getattr(args, 'force_train', False),
            force_predict=getattr(args, 'force_predict', False)
        )
        print(f"\n✅ Complete! Action: {result['action']}")
    elif args.command == "check":
        from validators.data_validator import validate_dataset as check_dataset
        report = check_dataset(args.data, verbose=True)
        if report.is_valid:
            print("\n✅ Dataset is ready for processing!")
        else:
            print("\n❌ Please fix the issues above before processing.")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

