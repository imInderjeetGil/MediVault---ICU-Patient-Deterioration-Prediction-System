from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
import joblib


OUTPUT_DIR = Path("models")

FEATURES = [
    "heart_rate",
    "spo2",
    "systolic_bp",
    "diastolic_bp",
    "respiratory_rate",
    "temperature",
]


def create_demo_data(n_per_class=5000):

    rng = np.random.default_rng(42)

    rows = []

    # ------------------------------------------------
    # LOW / STABLE
    # ------------------------------------------------

    for _ in range(n_per_class):

        rows.append({
            "heart_rate": rng.normal(75, 8),
            "spo2": rng.normal(97.5, 1),
            "systolic_bp": rng.normal(120, 10),
            "diastolic_bp": rng.normal(78, 7),
            "respiratory_rate": rng.normal(18, 2),
            "temperature": rng.normal(37.0, 0.3),
            "target": 0,
        })

    # ------------------------------------------------
    # MEDIUM / EARLY DETERIORATION
    # ------------------------------------------------

    for _ in range(n_per_class):

        rows.append({
            "heart_rate": rng.normal(100, 12),
            "spo2": rng.normal(93, 2),
            "systolic_bp": rng.normal(108, 10),
            "diastolic_bp": rng.normal(68, 7),
            "respiratory_rate": rng.normal(25, 4),
            "temperature": rng.normal(37.7, 0.5),
            "target": 1,
        })

    # ------------------------------------------------
    # HIGH / SEVERE DETERIORATION
    # ------------------------------------------------

    for _ in range(n_per_class):

        rows.append({
            "heart_rate": rng.normal(120, 12),
            "spo2": rng.normal(87, 3),
            "systolic_bp": rng.normal(95, 10),
            "diastolic_bp": rng.normal(60, 7),
            "respiratory_rate": rng.normal(32, 5),
            "temperature": rng.normal(38.2, 0.6),
            "target": 2,
        })

    df = pd.DataFrame(rows)

    return df


def main():

    df = create_demo_data()

    print("Dataset created")
    print(f"Rows: {len(df):,}")

    print("\nClass distribution:")
    print(df["target"].value_counts())

    X = df[FEATURES]
    y = df["target"]

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X, y)

    OUTPUT_DIR.mkdir(exist_ok=True)

    model.save_model(
        OUTPUT_DIR / "demo_risk_model.json"
    )

    joblib.dump(
        FEATURES,
        OUTPUT_DIR / "demo_feature_columns.joblib"
    )

    print("\nModel saved:")
    print("models/demo_risk_model.json")


if __name__ == "__main__":
    main()