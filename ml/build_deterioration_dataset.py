from pathlib import Path

import numpy as np
import pandas as pd


DATA_DIRS = [
    Path("data/training/training_setA"),
    Path("data/training/training_setB"),
]

OUTPUT_PATH = Path("data/deterioration_dataset.csv")

VITALS = {
    "HR": "heart_rate",
    "O2Sat": "spo2",
    "SBP": "systolic_bp",
    "DBP": "diastolic_bp",
    "Resp": "respiratory_rate",
    "Temp": "temperature",
}

WINDOW = 6


def calculate_slope(values):
    values = values.dropna()

    if len(values) < 2:
        return np.nan

    x = np.arange(len(values))

    return np.polyfit(x, values.values, 1)[0]


def build_window_features(window):

    features = {}

    for source, name in VITALS.items():

        values = window[source]

        # Current value
        features[name] = values.iloc[-1]

        # Change from first to last available value
        valid = values.dropna()

        if len(valid) >= 2:
            features[f"{name}_change"] = (
                valid.iloc[-1] - valid.iloc[0]
            )
        else:
            features[f"{name}_change"] = np.nan

        # Trend / slope
        features[f"{name}_slope"] = calculate_slope(values)

        # Missingness
        features[f"{name}_missing"] = (
            values.isna().mean()
        )

    # ------------------------------------------------
    # Physiological pattern signals
    # ------------------------------------------------

    worsening = 0

    # Heart rate rising
    if (
        pd.notna(features["heart_rate_slope"])
        and features["heart_rate_slope"] > 0
    ):
        worsening += 1

    # SpO2 falling
    if (
        pd.notna(features["spo2_slope"])
        and features["spo2_slope"] < 0
    ):
        worsening += 1

    # Blood pressure falling
    if (
        pd.notna(features["systolic_bp_slope"])
        and features["systolic_bp_slope"] < 0
    ):
        worsening += 1

    # Respiratory rate rising
    if (
        pd.notna(features["respiratory_rate_slope"])
        and features["respiratory_rate_slope"] > 0
    ):
        worsening += 1

    # Temperature rising
    if (
        pd.notna(features["temperature_slope"])
        and features["temperature_slope"] > 0
    ):
        worsening += 1

    features["worsening_count"] = worsening

    return features


def process_patient(file_path):

    df = pd.read_csv(file_path, sep="|")

    required_columns = list(VITALS.keys()) + [
        "ICULOS",
        "SepsisLabel",
    ]

    df = df[required_columns]

    rows = []

    positive_indices = df.index[
        df["SepsisLabel"] == 1
    ].tolist()

    # ------------------------------------------------
    # Positive windows
    # ------------------------------------------------

    for event_index in positive_indices:

        event_iculos = df.loc[event_index, "ICULOS"]

        window = df[
            (df["ICULOS"] < event_iculos)
            & (df["ICULOS"] >= event_iculos - WINDOW)
        ]

        if len(window) < 3:
            continue

        features = build_window_features(window)

        features["patient"] = file_path.stem
        features["event_iculos"] = event_iculos
        features["window_end"] = event_iculos
        features["target"] = 1

        rows.append(features)

    # ------------------------------------------------
    # Negative windows
    #
    # Take windows where there is no sepsis label
    # in the following 6 hours.
    # ------------------------------------------------

    for end_index in range(WINDOW, len(df)):

        end_iculos = df.iloc[end_index]["ICULOS"]

        window = df[
            (df["ICULOS"] <= end_iculos)
            & (df["ICULOS"] > end_iculos - WINDOW)
        ]

        if len(window) < 3:
            continue

        future = df[
            (df["ICULOS"] > end_iculos)
            & (df["ICULOS"] <= end_iculos + WINDOW)
        ]

        if future["SepsisLabel"].max() == 1:
            continue

        features = build_window_features(window)

        features["patient"] = file_path.stem
        features["event_iculos"] = np.nan
        features["window_end"] = end_iculos
        features["target"] = 0

        rows.append(features)

    return rows


def main():

    files = []

    for directory in DATA_DIRS:
        files.extend(directory.glob("*.psv"))

    print(f"Patient files: {len(files):,}")

    all_rows = []

    for index, file_path in enumerate(files, start=1):

        rows = process_patient(file_path)

        all_rows.extend(rows)

        if index % 5000 == 0:
            print(
                f"Processed {index:,} / {len(files):,}"
            )

    dataset = pd.DataFrame(all_rows)

    # Remove completely empty rows
    dataset = dataset.dropna(
        how="all",
        subset=[
            "heart_rate",
            "spo2",
            "systolic_bp",
            "respiratory_rate",
        ],
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    dataset.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print()
    print("========== DATASET ==========")
    print(f"Rows: {len(dataset):,}")
    print(f"Patients: {dataset['patient'].nunique():,}")

    print()
    print("Target distribution:")
    print(dataset["target"].value_counts())

    print()
    print("Target percentage:")
    print(
        dataset["target"]
        .value_counts(normalize=True)
        .mul(100)
        .round(2)
    )

    print()
    print(f"Saved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()