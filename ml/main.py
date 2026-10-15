from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone

import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import json
import requests


app = FastAPI(title="MediVault Risk Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# --------------------------------------------------
# Configuration
# --------------------------------------------------

DIRECTUS_URL = "http://3.6.67.190"

MODEL_PATH = "models/demo_risk_model.json"
FEATURES_PATH = "models/demo_feature_columns.joblib"

model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)

FEATURE_COLUMNS = joblib.load(FEATURES_PATH)


# --------------------------------------------------
# Data models
# --------------------------------------------------

class Vital(BaseModel):
    heart_rate: float | None = None
    respiratory_rate: float | None = None
    systolic_bp: float | None = None
    diastolic_bp: float | None = None
    spo2: float | None = None
    temperature: float | None = None


class PredictRequest(BaseModel):
    vitals: list[Vital]


# --------------------------------------------------
# Feature engineering
# --------------------------------------------------

def build_features(vitals: list[Vital]):
    rows = []

    for vital in vitals:
        rows.append({
            "heart_rate": vital.heart_rate,
            "spo2": vital.spo2,
            "systolic_bp": vital.systolic_bp,
            "diastolic_bp": vital.diastolic_bp,
            "respiratory_rate": vital.respiratory_rate,
            "temperature": vital.temperature,
        })

    df = pd.DataFrame(rows)

    return df[FEATURE_COLUMNS]
# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "service": "MediVault Risk Engine",
        "status": "running",
        "model": "XGBoost V2",
    }


# --------------------------------------------------
# Manual prediction endpoint
# --------------------------------------------------

@app.post("/predict")
def predict(request: PredictRequest):

    if not request.vitals:
        raise HTTPException(
            status_code=400,
            detail="At least one vital reading is required"
        )

    features = build_features(request.vitals)

    probabilities = model.predict_proba(features)[-1]
    prediction = int(np.argmax(probabilities))

    levels = {
        0: "LOW",
        1: "MEDIUM",
        2: "HIGH",
    }

    risk_level = levels[prediction]
    risk_score = float(probabilities[prediction])

    return {
        "risk_score": round(risk_score, 4),
        "risk_level": risk_level,
        "model": "Demo Deterioration Model",
        "readings_used": len(request.vitals),
    }


# --------------------------------------------------
# Patient prediction from Directus
# --------------------------------------------------

@app.post("/predict/{patient_id}")
def predict_patient(
    patient_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):

    token = credentials.credentials

    # ----------------------------------------------
    # Fetch latest patient vitals
    # ----------------------------------------------

    response = requests.get(
        f"{DIRECTUS_URL}/items/vitals",
        params={
    "filter[patient_id][_eq]": patient_id,
    "sort": "-timestamp",
    "limit": 24,
},
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail="Failed to fetch patient vitals from Directus"
        )

    data = response.json()

    records = data.get("data", [])

    records.reverse()

    vitals = []

    for vital in records:
        vitals.append({
            "heart_rate": vital.get("heart_rate"),
            "respiratory_rate": vital.get("respiratory_rate"),
            "systolic_bp": vital.get("systolic_bp"),
            "diastolic_bp": vital.get("diastolic_bp"),
            "spo2": vital.get("spo2"),
            "temperature": vital.get("temperature"),
    })

    if not vitals:
        raise HTTPException(
            status_code=404,
            detail="No vitals found for this patient"
        )

    # ----------------------------------------------
    # Build features
    # ----------------------------------------------

    features = build_features([Vital(**vital) for vital in vitals])

    probabilities = model.predict_proba(features)[-1]
    prediction = int(np.argmax(probabilities))

    levels = {
        0: "LOW",
        1: "MEDIUM",
        2: "HIGH",
    }

    risk_level = levels[prediction]
    risk_score = float(probabilities[prediction])

    # ----------------------------------------------
    # Save prediction to Directus
    # ----------------------------------------------

    prediction = {
        "patient_id": patient_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "risk_score": round(risk_score, 4),
        "risk_level": risk_level,
        "model_version": "demo-deterioration-v1",
        "prediction_status": "completed",
    }

    save_response = requests.post(
        f"{DIRECTUS_URL}/items/risk_predictions",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=prediction,
    )

    if not save_response.ok:

        raise HTTPException(
            status_code=save_response.status_code,
            detail={
                "message": "Prediction calculated but could not be saved",
                "directus_error": save_response.json(),
            },
        )

    saved_prediction = save_response.json()["data"]

    # ----------------------------------------------
    # Return result
    # ----------------------------------------------

    return {
        "patient_id": patient_id,
        "risk_score": round(risk_score, 4),
        "risk_level": risk_level,
        "readings_used": len(vitals),
        "model": "Demo Deterioration Model",
        "prediction_id": saved_prediction["id"],
        "prediction_status": "saved",
    }