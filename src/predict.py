import pandas as pd
import joblib
import os

# Paths
MODEL_PATH = "/Users/parvshah/Documents/Code Files/Customer-churn-prediction/models/churn_model.pkl"
PREPROCESSOR_PATH = "/Users/parvshah/Documents/Code Files/Customer-churn-prediction/models/preprocessing_pipeline.pkl"
OUTPUT_PATH = "/Users/parvshah/Documents/Code Files/Customer-churn-prediction/data/processed/churn_predictions.csv"


def load_artifacts():
    """Load trained model and preprocessing pipeline"""
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    return model, preprocessor


def load_input_data(csv_path):
    """Load new customer data"""
    df = pd.read_csv(csv_path)
    return df


def validate_input_data(df, required_columns):
    """Ensure uploaded CSV matches training schema"""
    missing_cols = set(required_columns) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing columns in input data: {missing_cols}")


def predict_churn(input_csv_path):
    """
    End-to-end churn prediction pipeline
    """
    # Load artifacts
    model, preprocessor = load_artifacts()

    # Load input data
    df = load_input_data(input_csv_path)

    # Keep original copy
    df_original = df.copy()

    # Required feature columns
    required_columns = preprocessor.feature_names_in_

    # Validate schema
    validate_input_data(df, required_columns)

    # Transform data
    X_processed = preprocessor.transform(df)

    # Predict
    churn_prob = model.predict_proba(X_processed)[:, 1]
    churn_pred = (churn_prob >= 0.5).astype(int)

    # Attach results
    df_original["Churn_Probability"] = churn_prob
    df_original["Churn_Prediction"] = pd.Series(churn_pred).map({1: "Yes", 0: "No"})

    # Save output
    df_original.to_csv(OUTPUT_PATH, index=False)

    return df_original


if __name__ == "__main__":
    input_csv = '/Users/parvshah/Documents/Code Files/Customer-churn-prediction/data/sample_input/Telco-Customer-Churn_Synthetic_300_Realistic.csv'
    results = predict_churn(input_csv)
    print("Prediction completed. Output saved to:", OUTPUT_PATH)
