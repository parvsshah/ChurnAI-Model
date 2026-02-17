"""
FastAPI Server for Adaptive Churn Prediction System
With PostgreSQL persistence, JWT auth, and single-step processing.
"""

import os
import io
import sys
import uuid
import json
import string
import random
import shutil
from datetime import datetime, timedelta, timezone
from typing import Optional, List

import pandas as pd
import numpy as np
import bcrypt
import jwt
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

from database import init_tables, JWT_SECRET
import database as db
from mappers.column_mapper import ColumnMapper
from validators.schema_validator import SchemaValidator
from pipeline.model_pipeline import ModelPipeline
from recommender.recommender import RecommendationEngine

app = FastAPI(title="ChurnAI API", version="2.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
MODELS_DIR = os.path.join(BASE_DIR, "models")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


# ─── Startup ──────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    """Initialize database tables on startup."""
    try:
        init_tables()
    except Exception as e:
        print(f"⚠️  Database init failed: {e}")
        print("   Server will run but DB features will be unavailable")


# ─── Helpers ──────────────────────────────────────────────────

def generate_process_code() -> str:
    """Generate an 8-char alphanumeric process code."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=8))


def get_file_path(file_id: str) -> str:
    return os.path.join(UPLOADS_DIR, f"{file_id}.csv")


def get_model_path(category: str) -> str:
    safe_cat = category.replace("/", "_").replace(" ", "_").lower()
    return os.path.join(MODELS_DIR, f"model_{safe_cat}.pkl")


def get_preprocessor_path(category: str) -> str:
    safe_cat = category.replace("/", "_").replace(" ", "_").lower()
    return os.path.join(MODELS_DIR, f"preprocessor_{safe_cat}.pkl")


def get_result_path(process_code: str) -> str:
    return os.path.join(RESULTS_DIR, f"{process_code}_results.csv")


# ─── Auth Helpers ─────────────────────────────────────────────

def create_token(user_id: int) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract and validate JWT from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = db.get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ─── Pydantic Models ─────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    name: str
    category: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class CategoryRequest(BaseModel):
    name: str
    description: str = ""
    model_type: str = "random_forest"
    columns: list = []


# ─── Health Check ─────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ─── Auth Endpoints ──────────────────────────────────────────

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    """Register a new user."""
    # Check if email already exists
    existing = db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(400, "Email already registered")

    # Hash password
    pw_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()

    # Create user
    user_id = db.create_user(req.username, req.email, pw_hash, req.name, req.category)

    # If category provided, also create user_category entry
    if req.category:
        db.add_user_category(user_id, req.category)

    token = create_token(user_id)
    user = db.get_user_by_id(user_id)
    categories = db.get_user_categories(user_id)
    user["categories"] = [c["category_name"] for c in categories]

    return {
        "token": token,
        "user": user,
    }


@app.post("/api/auth/login")
def login(req: LoginRequest):
    """Login with email and password."""
    user = db.get_user_by_email(req.email)
    if not user:
        raise HTTPException(401, "Invalid email or password")

    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(user["id"])
    # Remove password hash from response
    user_data = db.get_user_by_id(user["id"])
    categories = db.get_user_categories(user["id"])
    user_data["categories"] = [c["category_name"] for c in categories]

    return {
        "token": token,
        "user": user_data,
    }


@app.get("/api/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    """Get current user info."""
    categories = db.get_user_categories(user["id"])
    return {
        **user,
        "categories": [c["category_name"] for c in categories],
    }


@app.put("/api/auth/category")
def set_active_category(category: str = Query(...), user: dict = Depends(get_current_user)):
    """Set the user's active category."""
    db.update_user_category(user["id"], category)
    return {"status": "ok", "active_category": category}


# ─── Category Endpoints ──────────────────────────────────────

@app.post("/api/categories")
def register_category(req: CategoryRequest, user: dict = Depends(get_current_user)):
    """Register a new category for the user."""
    schema_json = json.dumps(req.columns) if req.columns else None

    # Validate column types
    valid_types = {"id", "target", "tenure", "cost_monthly", "cost_total", "contract", "categorical", "binary", "numeric"}
    for col in req.columns:
        if col.get("type") not in valid_types:
            raise HTTPException(400, f"Invalid column type: {col.get('type')}. Valid types: {', '.join(valid_types)}")

    # Check required columns
    has_target = any(c.get("type") == "target" for c in req.columns)
    if req.columns and not has_target:
        raise HTTPException(400, "Schema must include at least one 'target' column")

    cat_id = db.add_user_category(
        user["id"], req.name, req.model_type, schema_json, req.description
    )

    # Set as active category
    db.update_user_category(user["id"], req.name)

    return {"status": "ok", "category_id": cat_id, "name": req.name}


@app.get("/api/categories")
def list_categories(user: dict = Depends(get_current_user)):
    """List all categories for the current user."""
    cats = db.get_user_categories(user["id"])
    return {"categories": cats}


# ─── File Upload ──────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("Telecom"),
    user: dict = Depends(get_current_user),
):
    """Upload a CSV file for processing."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")

    process_code = generate_process_code()
    file_name = f"{process_code}.csv"
    file_path = os.path.join(UPLOADS_DIR, file_name)

    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Parse
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(400, f"Failed to parse CSV: {str(e)}")

    headers = df.columns.tolist()
    file_size_kb = round(os.path.getsize(file_path) / 1024, 1)

    # Store in DB
    upload_id = db.create_upload(
        process_code=process_code,
        user_id=user["id"],
        file_name=file_name,
        original_name=file.filename,
        category=category,
        row_count=len(df),
        column_count=len(headers),
        headers_json=json.dumps(headers),
        file_path=file_path,
        file_size_kb=file_size_kb,
    )

    return {
        "process_code": process_code,
        "upload_id": upload_id,
        "name": file.filename,
        "rows": len(df),
        "columns": len(headers),
        "headers": headers,
        "status": "uploaded",
        "file_size_kb": file_size_kb,
    }


# ─── Quick Schema Validator (no persistence) ─────────────────

@app.post("/api/validate-schema")
async def validate_schema(
    file: UploadFile = File(...),
    category: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Validate a CSV file's schema without persisting it. Used by dashboard quick-check."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {str(e)}")

    result = {
        "file_name": file.filename,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": [],
        "is_valid": True,
        "errors": [],
        "warnings": [],
    }

    # If category provided, validate against its registered schema
    if category:
        cat_schema = db.get_category_schema(user["id"], category)
        if cat_schema and cat_schema.get("schema_json"):
            schema_columns = json.loads(cat_schema["schema_json"])
            file_cols_lower = [c.lower().strip() for c in df.columns]

            for schema_col in schema_columns:
                col_name = schema_col.get("name", "").lower().strip()
                col_type = schema_col.get("type", "")
                required = col_type in ("target", "tenure")

                if col_name in file_cols_lower:
                    result["columns"].append({
                        "name": schema_col["name"], "type": col_type,
                        "status": "matched", "required": required,
                    })
                elif required:
                    result["is_valid"] = False
                    result["errors"].append(f"Required column '{schema_col['name']}' ({col_type}) not found")
                    result["columns"].append({
                        "name": schema_col["name"], "type": col_type,
                        "status": "missing", "required": True,
                    })
                else:
                    result["warnings"].append(f"Optional column '{schema_col['name']}' ({col_type}) not found")
                    result["columns"].append({
                        "name": schema_col["name"], "type": col_type,
                        "status": "missing", "required": False,
                    })

            return result

    # Auto-detect validation
    mapper = ColumnMapper(llm_provider=None)
    validator = SchemaValidator(mapper)
    val_result = validator.validate(df)
    result["is_valid"] = val_result.is_valid
    result["errors"] = val_result.errors
    result["warnings"] = val_result.warnings

    # Add detected columns info
    for col in df.columns:
        col_lower = col.lower().strip()
        detected_type = "unknown"
        if any(kw in col_lower for kw in ["id", "customer"]):
            detected_type = "id"
        elif any(kw in col_lower for kw in ["churn", "target", "label", "attrition"]):
            detected_type = "target"
        elif any(kw in col_lower for kw in ["tenure", "months", "duration"]):
            detected_type = "tenure"
        elif any(kw in col_lower for kw in ["charge", "cost", "fee", "price", "monthly"]):
            detected_type = "cost"
        elif any(kw in col_lower for kw in ["contract", "plan"]):
            detected_type = "contract"
        else:
            sample = str(df[col].iloc[0]) if len(df) > 0 else ""
            if sample.lower() in ["yes", "no", "true", "false", "0", "1"]:
                detected_type = "binary"
            elif sample.replace(".", "").replace("-", "").isdigit():
                detected_type = "numeric"
            else:
                detected_type = "categorical"

        result["columns"].append({
            "name": col, "type": detected_type,
            "status": "detected", "required": detected_type in ("target", "tenure"),
        })

    return result


# ─── Validate File Against Schema ────────────────────────────

@app.post("/api/validate/{process_code}")
def validate_file(process_code: str, user: dict = Depends(get_current_user)):
    """Validate uploaded file against category schema."""
    upload = db.get_upload_by_code(process_code)
    if not upload or upload["user_id"] != user["id"]:
        raise HTTPException(404, "Upload not found")

    df = pd.read_csv(upload["file_path"])
    category = upload["category"]

    # Get schema for category
    cat_schema = db.get_category_schema(user["id"], category)
    schema_columns = []
    if cat_schema and cat_schema.get("schema_json"):
        schema_columns = json.loads(cat_schema["schema_json"])

    validation = {"is_valid": True, "errors": [], "warnings": [], "matched_columns": []}

    if schema_columns:
        file_cols_lower = [c.lower().strip() for c in df.columns]

        for schema_col in schema_columns:
            col_name = schema_col.get("name", "").lower().strip()
            col_type = schema_col.get("type", "")
            required = col_type in ("target", "tenure")

            if col_name in file_cols_lower:
                validation["matched_columns"].append({
                    "name": schema_col["name"],
                    "type": col_type,
                    "status": "matched",
                })
            elif required:
                validation["is_valid"] = False
                validation["errors"].append(f"Required column '{schema_col['name']}' ({col_type}) not found")
            else:
                validation["warnings"].append(f"Optional column '{schema_col['name']}' ({col_type}) not found")
    else:
        # No schema defined — do auto-detection validation
        mapper = ColumnMapper(llm_provider=None)
        validator = SchemaValidator(mapper)
        result = validator.validate(df)
        validation["is_valid"] = result.is_valid
        validation["errors"] = result.errors
        validation["warnings"] = result.warnings

    status = "uploaded" if validation["is_valid"] else "failed"
    db.update_upload_status(process_code, status, json.dumps(validation))

    return validation


# ─── Process File (Validate → Train → Predict) ──────────────

@app.post("/api/process/{process_code}")
def process_file(
    process_code: str,
    threshold: float = Query(0.5, ge=0.0, le=1.0),
    user: dict = Depends(get_current_user),
):
    """Full pipeline: validate → train → predict in one step."""
    upload = db.get_upload_by_code(process_code)
    if not upload or upload["user_id"] != user["id"]:
        raise HTTPException(404, "Upload not found")

    file_path = upload["file_path"]
    category = upload["category"]

    # Get model type from category config
    cat_config = db.get_category_schema(user["id"], category)
    model_type = cat_config["model_type"] if cat_config else "random_forest"

    db.update_upload_status(process_code, "processing", "Running ML pipeline...")

    try:
        df = pd.read_csv(file_path)

        # Step 1: Column mapping
        mapper = ColumnMapper(llm_provider=None)
        mapping_result = mapper.map_columns(df, mode="auto", use_llm=False)

        # Step 2: Validate
        validator = SchemaValidator(mapper)
        validation = validator.validate(df, mapping_result)

        if not validation.is_valid:
            db.update_upload_status(process_code, "failed", json.dumps(validation.errors))
            return JSONResponse(status_code=400, content={
                "error": "Validation failed",
                "errors": validation.errors,
                "process_code": process_code,
            })

        # Step 3: Train
        pipeline = ModelPipeline(model_type=model_type, column_mapper=mapper)
        pipeline.train(df, mapping_result)

        # Save model
        model_path = get_model_path(category)
        preprocessor_path = get_preprocessor_path(category)
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        pipeline.save(model_path, preprocessor_path)

        # Step 4: Predict
        pred_result = pipeline.predict(df, threshold=threshold)

        output_df = df.copy()
        output_df["Churn_Probability"] = pred_result.probabilities
        output_df["Churn_Prediction"] = pred_result.prediction_labels

        # Step 5: Recommendations
        try:
            rec_engine = RecommendationEngine(pipeline.mapping_result, use_llm=False)
            rec_engine.fit(df, pipeline.mapping_result)
            recommendations = rec_engine.recommend_batch(
                df,
                churn_probabilities=pred_result.probabilities,
                churn_predictions=pred_result.prediction_labels,
            )
            rec_df = rec_engine.to_dataframe(recommendations)
            output_df["Risk_Level"] = rec_df["risk_level"]
            output_df["Churn_Signals"] = rec_df["churn_signals"]
            output_df["Recommendations"] = rec_df["recommendations"]
        except Exception as rec_err:
            print(f"Recommendation generation failed (non-fatal): {rec_err}")

        # Save results to file
        result_path = get_result_path(process_code)
        output_df.to_csv(result_path, index=False)

        # Build summary
        churn_count = int((output_df["Churn_Prediction"] == "Yes").sum())
        total = len(df)
        churn_rate = round(churn_count / total * 100, 1) if total > 0 else 0

        # Save to DB
        db.create_result(
            process_code=process_code,
            upload_id=upload["id"],
            user_id=user["id"],
            total_records=total,
            predicted_churn=churn_count,
            predicted_stay=total - churn_count,
            churn_rate=churn_rate,
            result_file_path=result_path,
        )

        db.update_upload_status(process_code, "completed", f"Processed {total} records, {churn_count} churners ({churn_rate}%)")

        return {
            "status": "success",
            "process_code": process_code,
            "total_records": total,
            "predicted_churn": churn_count,
            "predicted_stay": total - churn_count,
            "churn_rate": churn_rate,
            "model_type": model_type,
        }

    except Exception as e:
        db.update_upload_status(process_code, "failed", str(e))
        raise HTTPException(500, f"Processing failed: {str(e)}")


# ─── List Files ───────────────────────────────────────────────

@app.get("/api/files")
def list_files(category: Optional[str] = None, user: dict = Depends(get_current_user)):
    """List all uploaded files for the current user."""
    uploads = db.get_uploads_by_user(user["id"], category)
    # Convert datetime objects to strings
    for u in uploads:
        for k, v in u.items():
            if isinstance(v, datetime):
                u[k] = v.isoformat()
    return {"files": uploads}


# ─── Get Upload Info ──────────────────────────────────────────

@app.get("/api/files/{process_code}")
def get_file_info(process_code: str, user: dict = Depends(get_current_user)):
    """Get metadata for a specific upload."""
    upload = db.get_upload_by_code(process_code)
    if not upload or upload["user_id"] != user["id"]:
        raise HTTPException(404, "Upload not found")
    for k, v in upload.items():
        if isinstance(v, datetime):
            upload[k] = v.isoformat()
    return upload


# ─── Get Results ──────────────────────────────────────────────

@app.get("/api/results")
def list_all_results(
    category: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """List all prediction results for the user."""
    results = db.get_results_by_user(user["id"], category)
    for r in results:
        for k, v in r.items():
            if isinstance(v, datetime):
                r[k] = v.isoformat()
    return {"results": results}


@app.get("/api/results/{process_code}")
def get_results(
    process_code: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=500),
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    min_probability: Optional[float] = None,
    max_probability: Optional[float] = None,
    prediction: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Get prediction results for a processed file."""
    result_path = get_result_path(process_code)
    if not os.path.exists(result_path):
        raise HTTPException(404, "Results not found. Process the file first.")

    df = pd.read_csv(result_path).fillna("")

    # Apply filters
    if risk_level and "Risk_Level" in df.columns:
        df = df[df["Risk_Level"].str.lower() == risk_level.lower()]

    if prediction and "Churn_Prediction" in df.columns:
        if prediction == "churn":
            df = df[df["Churn_Prediction"].astype(str).str.lower().isin(["yes", "1", "true"])]
        elif prediction == "stay":
            df = df[df["Churn_Prediction"].astype(str).str.lower().isin(["no", "0", "false"])]

    if min_probability is not None and "Churn_Probability" in df.columns:
        df = df[pd.to_numeric(df["Churn_Probability"], errors="coerce") >= min_probability]

    if max_probability is not None and "Churn_Probability" in df.columns:
        df = df[pd.to_numeric(df["Churn_Probability"], errors="coerce") <= max_probability]

    if search:
        mask = df.astype(str).apply(lambda row: row.str.contains(search, case=False).any(), axis=1)
        df = df[mask]

    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_data = df.iloc[start:end]

    # Get summary from DB
    result_info = db.get_result_by_code(process_code)

    return {
        "process_code": process_code,
        "total_rows": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "headers": df.columns.tolist(),
        "data": page_data.to_dict(orient="records"),
        "summary": {
            "total_records": result_info["total_records"] if result_info else total,
            "predicted_churn": result_info["predicted_churn"] if result_info else 0,
            "predicted_stay": result_info["predicted_stay"] if result_info else 0,
            "churn_rate": result_info["churn_rate"] if result_info else 0,
        } if result_info else None,
    }


# ─── Export Results ───────────────────────────────────────────

@app.get("/api/export/{process_code}")
def export_results(
    process_code: str,
    format: str = Query("csv", enum=["csv", "json"]),
    columns: Optional[str] = None,
    filename: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Export prediction results as CSV or JSON."""
    result_path = get_result_path(process_code)
    if not os.path.exists(result_path):
        raise HTTPException(404, "Results not found")

    df = pd.read_csv(result_path).fillna("")

    if columns:
        selected = [c.strip() for c in columns.split(",") if c.strip() in df.columns]
        if selected:
            df = df[selected]

    export_name = filename or f"churnai_{process_code}"

    if format == "json":
        export_path = os.path.join(RESULTS_DIR, f"{process_code}_export.json")
        df.to_json(export_path, orient="records", indent=2)
        return FileResponse(
            export_path,
            media_type="application/json",
            filename=f"{export_name}.json",
        )
    else:
        export_path = os.path.join(RESULTS_DIR, f"{process_code}_export.csv")
        df.to_csv(export_path, index=False)
        return FileResponse(
            export_path,
            media_type="text/csv",
            filename=f"{export_name}.csv",
        )


# ─── Recommendations ─────────────────────────────────────────

@app.get("/api/recommendations/{process_code}")
def get_recommendations(process_code: str, user: dict = Depends(get_current_user)):
    """Get AI recommendations grouped by type with linked customers."""
    result_path = get_result_path(process_code)
    if not os.path.exists(result_path):
        raise HTTPException(404, "Results not found. Process the file first.")

    df = pd.read_csv(result_path).fillna("")

    if "Risk_Level" not in df.columns:
        raise HTTPException(400, "No recommendation data found.")

    # Get file metadata
    upload = db.get_upload_by_code(process_code)
    file_info = {
        "file_name": upload["original_name"] if upload else process_code,
        "category": upload["category"] if upload else "",
        "uploaded_at": upload["uploaded_at"].isoformat() if upload and isinstance(upload.get("uploaded_at"), datetime) else "",
    }

    risk_counts = df["Risk_Level"].value_counts().to_dict()

    # Group recommendations by type
    rec_groups = {}
    id_col = None
    for c in df.columns:
        if c.lower() in ["customerid", "customer_id", "id", "customer id"]:
            id_col = c
            break

    high_risk_df = df[df["Risk_Level"].isin(["critical", "high"])]

    for _, row in high_risk_df.iterrows():
        recs = row.get("Recommendations", "")
        if not recs:
            continue
        for rec in str(recs).split("; "):
            rec = rec.strip()
            if not rec:
                continue
            # Categorize recommendation
            rec_lower = rec.lower()
            if any(w in rec_lower for w in ["price", "pricing", "discount", "offer", "cost", "fee", "charge"]):
                group = "Pricing & Offers"
            elif any(w in rec_lower for w in ["engage", "engagement", "loyalty", "reward", "retain"]):
                group = "Engagement & Loyalty"
            elif any(w in rec_lower for w in ["support", "service", "complaint", "resolution", "help"]):
                group = "Customer Support"
            elif any(w in rec_lower for w in ["contract", "plan", "upgrade", "renew", "tenure"]):
                group = "Contract & Plans"
            elif any(w in rec_lower for w in ["usage", "feature", "product", "onboard"]):
                group = "Product & Usage"
            else:
                group = "General"

            if group not in rec_groups:
                rec_groups[group] = {"recommendations": set(), "customers": []}

            rec_groups[group]["recommendations"].add(rec)

            cust_id = str(row[id_col]) if id_col else f"Row-{row.name}"
            if cust_id not in [c["id"] for c in rec_groups[group]["customers"]]:
                rec_groups[group]["customers"].append({
                    "id": cust_id,
                    "risk_level": row.get("Risk_Level", "unknown"),
                    "churn_probability": float(row.get("Churn_Probability", 0)),
                })

    # Convert sets to lists
    grouped = []
    for group_name, data in rec_groups.items():
        grouped.append({
            "group": group_name,
            "recommendations": list(data["recommendations"]),
            "customer_count": len(data["customers"]),
            "customers": data["customers"][:10],  # Limit per group
        })
    grouped.sort(key=lambda x: x["customer_count"], reverse=True)

    # Also return per-customer details (top 20)
    customers = []
    for _, row in high_risk_df.head(20).iterrows():
        customers.append({
            "id": str(row[id_col]) if id_col else f"Row-{row.name}",
            "data": {col: row[col] for col in df.columns if col not in ["Churn_Signals", "Recommendations"]},
            "risk_level": row.get("Risk_Level", "unknown"),
            "churn_probability": float(row.get("Churn_Probability", 0)),
            "signals": row.get("Churn_Signals", "").split("; ") if row.get("Churn_Signals") else [],
            "recommendations": row.get("Recommendations", "").split("; ") if row.get("Recommendations") else [],
        })

    return {
        "process_code": process_code,
        "file_info": file_info,
        "total_records": len(df),
        "risk_distribution": risk_counts,
        "recommendation_groups": grouped,
        "high_risk_customers": customers,
    }


# ─── Dashboard Stats ─────────────────────────────────────────

@app.get("/api/dashboard/stats")
def dashboard_stats(category: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get dashboard statistics with risk distribution."""
    uploads = db.get_uploads_by_user(user["id"], category)
    results = db.get_results_by_user(user["id"], category)

    total_uploads = len(uploads)
    total_processed = len([u for u in uploads if u["status"] == "completed"])
    total_records = sum(r["total_records"] for r in results) if results else 0
    total_churners = sum(r["predicted_churn"] for r in results) if results else 0
    avg_churn_rate = round(sum(r["churn_rate"] for r in results) / len(results), 1) if results else 0

    # Aggregate risk distribution from result CSVs
    risk_distribution = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for r in results:
        rpath = r.get("result_file_path", "")
        if rpath and os.path.exists(rpath):
            try:
                rdf = pd.read_csv(rpath)
                if "Risk_Level" in rdf.columns:
                    counts = rdf["Risk_Level"].value_counts().to_dict()
                    for level in risk_distribution:
                        risk_distribution[level] += counts.get(level, 0)
            except Exception:
                pass

    recent_processes = []
    for u in uploads[:5]:
        p = {
            "process_code": u["process_code"],
            "file_name": u["original_name"],
            "category": u["category"],
            "status": u["status"],
            "rows": u["row_count"],
        }
        for k, v in u.items():
            if isinstance(v, datetime):
                p[k.replace("uploaded_at", "date")] = v.isoformat()
        recent_processes.append(p)

    return {
        "total_uploads": total_uploads,
        "total_processed": total_processed,
        "total_records": total_records,
        "total_churners": total_churners,
        "avg_churn_rate": avg_churn_rate,
        "risk_distribution": risk_distribution,
        "recent_processes": recent_processes,
    }


# ─── Delete Upload ────────────────────────────────────────────

@app.delete("/api/files/{process_code}")
def delete_file(process_code: str, user: dict = Depends(get_current_user)):
    """Delete an uploaded file and its results."""
    upload = db.get_upload_by_code(process_code)
    if not upload or upload["user_id"] != user["id"]:
        raise HTTPException(404, "Upload not found")

    # Clean up files
    for path in [upload["file_path"], get_result_path(process_code)]:
        if path and os.path.exists(path):
            os.remove(path)

    db.delete_upload(process_code)
    return {"status": "deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
