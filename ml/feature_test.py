from pathlib import Path

import pandas as pd


PATIENT_FILE = (
    Path(__file__).parent
    / "data"
    / "training"
    / "training_setA"
    / "p000001.psv"
)

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


def create_features(df):
    features = df.copy()

    # Current values
    selected = VITALS + LABS

    for column in selected:
        if column not in features.columns:
            continue

        # Missingness indicator
        features[f"{column}_missing"] = features[column].isna().astype(int)

        # Previous-hour value
        features[f"{column}_previous"] = features[column].shift(1)

        # Change from previous hour
        features[f"{column}_change"] = (
            features[column] - features[column].shift(1)
        )

        # Three-hour rolling average
        features[f"{column}_rolling_mean"] = (
            features[column]
            .rolling(window=3, min_periods=1)
            .mean()
        )

    return features


def main():
    df = pd.read_csv(PATIENT_FILE, sep="|")

    features = create_features(df)

    print("Original shape:", df.shape)
    print("Feature shape:", features.shape)

    print("\nNew feature examples:")

    columns_to_show = [
        "HR",
        "HR_previous",
        "HR_change",
        "HR_rolling_mean",
        "HR_missing",
        "O2Sat",
        "O2Sat_change",
        "O2Sat_rolling_mean",
        "Lactate",
        "Lactate_missing",
    ]

    print(features[columns_to_show].head(10).to_string(index=False))


if __name__ == "__main__":
    main()