from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from xgboost import XGBClassifier


DATA_DIR = Path(__file__).parent / "data" / "training"
MODEL_DIR = Path(__file__).parent / "models"


VITALS = [
    "HR",
    "O2Sat",
    "Temp",
    "SBP",
    "MAP",
    "DBP",
    "Resp",
]

LABS = [
    "Lactate",
    "WBC",
    "Creatinine",
    "BUN",
    "Glucose",
    "Platelets",
    "pH",
]

CONTEXT = [
    "Age",
    "Gender",
    "HospAdmTime",
    "ICULOS",
]


def get_patient_files():
    files = []

    for dataset in ["training_setA", "training_setB"]:
        folder = DATA_DIR / dataset

        if not folder.exists():
            raise FileNotFoundError(f"Dataset folder not found: {folder}")

        files.extend(folder.glob("*.psv"))

    return sorted(files)


def create_features(df):
    features = df.copy()

    for column in VITALS + LABS:
        if column not in features.columns:
            continue

        features[f"{column}_missing"] = (
            features[column].isna().astype(int)
        )

        features[f"{column}_previous"] = (
            features[column].shift(1)
        )

        features[f"{column}_change"] = (
            features[column] - features[column].shift(1)
        )

        features[f"{column}_rolling_mean"] = (
            features[column]
            .rolling(window=3, min_periods=1)
            .mean()
        )

    return features


def load_dataset():
    files = get_patient_files()

    print(f"Found {len(files):,} patient files.")

    frames = []

    for index, file_path in enumerate(files, start=1):
        df = pd.read_csv(file_path, sep="|")

        df["patient_id"] = file_path.stem

        df = create_features(df)

        frames.append(df)

        if index % 1000 == 0:
            print(
                f"Processed {index:,}/{len(files):,} patients"
            )

    return pd.concat(frames, ignore_index=True)


def prepare_features(dataset):
    feature_columns = [
        column
        for column in dataset.columns
        if column not in ["SepsisLabel", "patient_id"]
    ]

    X = dataset[feature_columns].copy()
    y = dataset["SepsisLabel"].copy()
    groups = dataset["patient_id"].copy()

    missing_ratio = X.isna().mean()

    keep_columns = missing_ratio[
        missing_ratio <= 0.95
    ].index.tolist()

    removed_columns = sorted(
        set(feature_columns) - set(keep_columns)
    )

    print(
        f"\nFeatures before filtering: {len(feature_columns)}"
    )

    print(
        f"Features after filtering:  {len(keep_columns)}"
    )

    if removed_columns:
        print("\nRemoved sparse features:")
        for column in removed_columns:
            print(f"  - {column}")

    return X[keep_columns], y, groups, keep_columns


def split_dataset(X, y, groups):
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=42,
    )

    train_indices, validation_indices = next(
        splitter.split(X, y, groups=groups)
    )

    X_train = X.iloc[train_indices]
    X_validation = X.iloc[validation_indices]

    y_train = y.iloc[train_indices]
    y_validation = y.iloc[validation_indices]

    train_groups = groups.iloc[train_indices]
    validation_groups = groups.iloc[validation_indices]

    print("\nPatient split:")
    print(f"Training patients:   {train_groups.nunique():,}")
    print(f"Validation patients: {validation_groups.nunique():,}")

    print(f"\nTraining rows:   {len(X_train):,}")
    print(f"Validation rows: {len(X_validation):,}")

    return (
        X_train,
        X_validation,
        y_train,
        y_validation,
    )


def impute_missing_values(X_train, X_validation):
    imputer = SimpleImputer(strategy="median")

    X_train = pd.DataFrame(
        imputer.fit_transform(X_train),
        columns=X_train.columns,
        index=X_train.index,
    )

    X_validation = pd.DataFrame(
        imputer.transform(X_validation),
        columns=X_validation.columns,
        index=X_validation.index,
    )

    return X_train, X_validation, imputer


def train_model(X_train, y_train):
    positive = int(y_train.sum())
    negative = int(len(y_train) - positive)

    scale_pos_weight = negative / positive

    print("\nClass balance:")
    print(f"Negative: {negative:,}")
    print(f"Positive: {positive:,}")
    print(f"scale_pos_weight: {scale_pos_weight:.2f}")

    model = XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="binary:logistic",
        eval_metric="aucpr",
        scale_pos_weight=scale_pos_weight,
        tree_method="hist",
        n_jobs=-1,
        random_state=42,
    )

    print("\nTraining XGBoost...")

    model.fit(
        X_train,
        y_train,
        verbose=True,
    )

    return model


def evaluate_model(model, X_validation, y_validation):
    probabilities = model.predict_proba(
        X_validation
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)

    roc_auc = roc_auc_score(
        y_validation,
        probabilities,
    )

    pr_auc = average_precision_score(
        y_validation,
        probabilities,
    )

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

    print("\n========== MODEL RESULTS ==========")

    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1:        {f1:.4f}")

    print("\nClassification report:")
    print(
        classification_report(
            y_validation,
            predictions,
            zero_division=0,
        )
    )

    return probabilities


def save_model(model, imputer, feature_columns):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    model_path = MODEL_DIR / "risk_model.json"
    imputer_path = MODEL_DIR / "imputer.joblib"
    features_path = MODEL_DIR / "feature_columns.json"

    model.save_model(model_path)

    joblib.dump(
        imputer,
        imputer_path,
    )

    pd.Series(feature_columns).to_json(
        features_path,
        orient="values",
        indent=2,
    )

    print("\nModels saved:")

    print(f"  {model_path}")
    print(f"  {imputer_path}")
    print(f"  {features_path}")


def main():
    print("===================================")
    print("MediVault Risk Model Training")
    print("===================================\n")

    dataset = load_dataset()

    print("\nDataset loaded.")
    print(f"Rows: {len(dataset):,}")

    (
        X,
        y,
        groups,
        feature_columns,
    ) = prepare_features(dataset)

    (
        X_train,
        X_validation,
        y_train,
        y_validation,
    ) = split_dataset(
        X,
        y,
        groups,
    )

    (
        X_train,
        X_validation,
        imputer,
    ) = impute_missing_values(
        X_train,
        X_validation,
    )

    print("\nMissing values after imputation:")
    print(
        "Training:",
        int(X_train.isna().sum().sum()),
    )

    print(
        "Validation:",
        int(X_validation.isna().sum().sum()),
    )

    model = train_model(
        X_train,
        y_train,
    )

    evaluate_model(
        model,
        X_validation,
        y_validation,
    )

    save_model(
        model,
        imputer,
        feature_columns,
    )

    print("\nTraining pipeline completed successfully.")


if __name__ == "__main__":
    main()