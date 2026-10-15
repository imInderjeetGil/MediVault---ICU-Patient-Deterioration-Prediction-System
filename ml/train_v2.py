from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from xgboost import XGBClassifier


BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data" / "training"
MODEL_DIR = BASE_DIR / "models"


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

    for folder_name in ["training_setA", "training_setB"]:
        files.extend(
            (DATA_DIR / folder_name).glob("*.psv")
        )

    return sorted(files)


def create_v2_features(df):
    df = df.copy()

    # Make sure patient timeline is ordered.
    if "ICULOS" in df.columns:
        df = df.sort_values("ICULOS").reset_index(drop=True)

    # -----------------------------
    # Current values + missingness
    # -----------------------------
    for column in VITALS + LABS:

        if column not in df.columns:
            continue

        df[f"{column}_missing"] = (
            df[column].isna().astype(int)
        )

    # -----------------------------
    # Vital temporal features
    # -----------------------------
    for column in VITALS:

        if column not in df.columns:
            continue

        df[f"{column}_previous"] = (
            df[column].ffill().shift(1)
        )

        df[f"{column}_change"] = (
            df[column]
            - df[f"{column}_previous"]
        )

        df[f"{column}_rolling_3h"] = (
            df[column]
            .ffill()
            .rolling(3, min_periods=1)
            .mean()
        )

        df[f"{column}_rolling_6h"] = (
            df[column]
            .ffill()
            .rolling(6, min_periods=1)
            .mean()
        )

    # -----------------------------
    # Sparse labs:
    # latest available value
    # -----------------------------
    for column in LABS:

        if column not in df.columns:
            continue

        df[f"{column}_latest"] = (
            df[column].ffill()
        )

        df[f"{column}_hours_since"] = (
            df[column]
            .notna()
            .astype(int)
            .groupby(
                df[column].notna().cumsum()
            )
            .cumcount()
        )

    return df


def load_dataset():
    files = get_patient_files()

    print(f"Found {len(files):,} patients.")

    frames = []

    for index, file_path in enumerate(
        files,
        start=1,
    ):

        df = pd.read_csv(
            file_path,
            sep="|",
        )

        df["patient_id"] = file_path.stem

        df = create_v2_features(df)

        frames.append(df)

        if index % 1000 == 0:
            print(
                f"Processed "
                f"{index:,}/{len(files):,}"
            )

    return pd.concat(
        frames,
        ignore_index=True,
    )


def prepare_features(dataset):

    excluded = [
        "SepsisLabel",
        "patient_id",
    ]

    feature_columns = [
        column
        for column in dataset.columns
        if column not in excluded
    ]

    X = dataset[feature_columns].copy()

    y = dataset["SepsisLabel"].copy()

    groups = dataset["patient_id"].copy()

    # Remove only completely empty columns.
    missing_ratio = X.isna().mean()

    keep_columns = missing_ratio[
        missing_ratio < 1.0
    ].index.tolist()

    removed = sorted(
        set(feature_columns)
        - set(keep_columns)
    )

    print(
        f"\nV2 features before filtering: "
        f"{len(feature_columns)}"
    )

    print(
        f"V2 features after filtering:  "
        f"{len(keep_columns)}"
    )

    if removed:
        print("\nCompletely empty features:")
        for column in removed:
            print(f"  - {column}")

    return (
        X[keep_columns],
        y,
        groups,
        keep_columns,
    )


def split_dataset(X, y, groups):

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=42,
    )

    train_idx, validation_idx = next(
        splitter.split(
            X,
            y,
            groups=groups,
        )
    )

    X_train = X.iloc[train_idx]
    X_validation = X.iloc[validation_idx]

    y_train = y.iloc[train_idx]
    y_validation = y.iloc[validation_idx]

    train_groups = groups.iloc[train_idx]
    validation_groups = groups.iloc[
        validation_idx
    ]

    print("\nPatient split:")

    print(
        f"Training patients:   "
        f"{train_groups.nunique():,}"
    )

    print(
        f"Validation patients: "
        f"{validation_groups.nunique():,}"
    )

    print(
        f"\nTraining rows:   "
        f"{len(X_train):,}"
    )

    print(
        f"Validation rows: "
        f"{len(X_validation):,}"
    )

    return (
        X_train,
        X_validation,
        y_train,
        y_validation,
    )


def impute(X_train, X_validation):

    imputer = SimpleImputer(
        strategy="median",
    )

    X_train = pd.DataFrame(
        imputer.fit_transform(
            X_train
        ),
        columns=X_train.columns,
        index=X_train.index,
    )

    X_validation = pd.DataFrame(
        imputer.transform(
            X_validation
        ),
        columns=X_validation.columns,
        index=X_validation.index,
    )

    return (
        X_train,
        X_validation,
        imputer,
    )


def train_model(X_train, y_train):

    positive = int(y_train.sum())
    negative = len(y_train) - positive

    weight = negative / positive

    print("\nClass balance:")
    print(f"Negative: {negative:,}")
    print(f"Positive: {positive:,}")
    print(
        f"scale_pos_weight: "
        f"{weight:.2f}"
    )

    model = XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="binary:logistic",
        eval_metric="aucpr",
        scale_pos_weight=weight,
        tree_method="hist",
        n_jobs=-1,
        random_state=42,
    )

    print("\nTraining V2 XGBoost...")

    model.fit(
        X_train,
        y_train,
        verbose=True,
    )

    return model


def evaluate(
    model,
    X_validation,
    y_validation,
):

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

    print("\n========== V2 RESULTS ==========")

    print(
        f"ROC-AUC:   {roc_auc:.4f}"
    )

    print(
        f"PR-AUC:    {pr_auc:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall:    {recall:.4f}"
    )

    print(
        f"F1:        {f1:.4f}"
    )

    return probabilities


def save_model(
    model,
    imputer,
    feature_columns,
):

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    model.save_model(
        MODEL_DIR / "risk_model_v2.json"
    )

    joblib.dump(
        imputer,
        MODEL_DIR / "imputer_v2.joblib"
    )

    pd.Series(
        feature_columns
    ).to_json(
        MODEL_DIR / "feature_columns_v2.json",
        orient="values",
        indent=2,
    )

    print("\nV2 model saved.")


def main():

    print(
        "==================================="
    )
    print(
        "MediVault Risk Model V2"
    )
    print(
        "===================================\n"
    )

    dataset = load_dataset()

    print(
        f"\nDataset rows: "
        f"{len(dataset):,}"
    )

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
    ) = impute(
        X_train,
        X_validation,
    )

    print("\nMissing after imputation:")
    print(
        "Train:",
        int(
            X_train.isna().sum().sum()
        ),
    )
    print(
        "Validation:",
        int(
            X_validation.isna().sum().sum()
        ),
    )

    model = train_model(
        X_train,
        y_train,
    )

    evaluate(
        model,
        X_validation,
        y_validation,
    )

    save_model(
        model,
        imputer,
        feature_columns,
    )


if __name__ == "__main__":
    main()