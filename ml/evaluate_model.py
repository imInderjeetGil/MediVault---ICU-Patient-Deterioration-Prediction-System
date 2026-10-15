from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from xgboost import XGBClassifier


MODEL_DIR = Path(__file__).parent / "models"


def load_validation_data():
    # Same preprocessing pipeline used during training.
    # We import these functions from train.py.
    from train import (
        load_dataset,
        prepare_features,
        split_dataset,
        impute_missing_values,
    )

    dataset = load_dataset()

    X, y, groups, feature_columns = prepare_features(dataset)

    (
        X_train,
        X_validation,
        y_train,
        y_validation,
    ) = split_dataset(X, y, groups)

    imputer = joblib.load(
        MODEL_DIR / "imputer.joblib"
    )

    X_validation = pd.DataFrame(
        imputer.transform(X_validation),
        columns=X_validation.columns,
        index=X_validation.index,
    )

    return X_validation, y_validation


def load_model():
    model = XGBClassifier()

    model.load_model(
        MODEL_DIR / "risk_model.json"
    )

    return model


def evaluate_thresholds(model, X_validation, y_validation):
    probabilities = model.predict_proba(
        X_validation
    )[:, 1]

    print("\n========== THRESHOLD ANALYSIS ==========")

    print(
        f"{'Threshold':<12}"
        f"{'Precision':<12}"
        f"{'Recall':<12}"
        f"{'F1':<12}"
    )

    print("-" * 48)

    for threshold in [
        0.10,
        0.15,
        0.20,
        0.25,
        0.30,
        0.35,
        0.40,
        0.45,
        0.50,
        0.55,
        0.60,
        0.65,
        0.70,
        0.75,
        0.80,
        0.85,
        0.90,
    ]:
        predictions = (
            probabilities >= threshold
        ).astype(int)

        precision = precision_score(
            y_validation,
            predictions,
            zero_division=0,
        )

        recall = recall_score(
            y_validation,
            predictions,
            zero_division=0,
        )

        f1 = f1_score(
            y_validation,
            predictions,
            zero_division=0,
        )

        print(
            f"{threshold:<12.2f}"
            f"{precision:<12.4f}"
            f"{recall:<12.4f}"
            f"{f1:<12.4f}"
        )

    print("\nOverall:")
    print(
        f"ROC-AUC: "
        f"{roc_auc_score(y_validation, probabilities):.4f}"
    )

    print(
        f"PR-AUC:  "
        f"{average_precision_score(y_validation, probabilities):.4f}"
    )


def main():
    print("Loading validation data...")

    X_validation, y_validation = (
        load_validation_data()
    )

    print(
        f"Validation rows: "
        f"{len(X_validation):,}"
    )

    model = load_model()

    print("Model loaded successfully.")

    evaluate_thresholds(
        model,
        X_validation,
        y_validation,
    )


if __name__ == "__main__":
    main()