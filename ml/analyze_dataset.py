from pathlib import Path
import pandas as pd
import numpy as np


DATA_DIRS = [
    Path("data/training/training_setA"),
    Path("data/training/training_setB"),
]

VITALS = [
    "HR",
    "O2Sat",
    "Temp",
    "SBP",
    "DBP",
    "Resp",
]

WINDOW_HOURS = 6


def analyze_patient(file_path):

    df = pd.read_csv(file_path, sep="|")

    # Keep only required columns
    required = VITALS + ["ICULOS", "SepsisLabel"]
    df = df[required]

    positive_rows = df[df["SepsisLabel"] == 1]

    if positive_rows.empty:
        return None

    # First known event
    event_index = positive_rows.index[0]
    event_iculos = df.loc[event_index, "ICULOS"]

    # Six hours before first positive event
    window = df[
        (df["ICULOS"] < event_iculos)
        & (df["ICULOS"] >= event_iculos - WINDOW_HOURS)
    ].copy()

    if len(window) < 2:
        return None

    first = window.iloc[0]
    last = window.iloc[-1]

    changes = {}

    for vital in VITALS:
        start = first[vital]
        end = last[vital]

        if pd.notna(start) and pd.notna(end):
            changes[vital] = end - start
        else:
            changes[vital] = np.nan

    return {
        "patient": file_path.stem,
        "event_iculos": event_iculos,
        "window_rows": len(window),

        "hr_change": changes["HR"],
        "spo2_change": changes["O2Sat"],
        "temp_change": changes["Temp"],
        "sbp_change": changes["SBP"],
        "dbp_change": changes["DBP"],
        "resp_change": changes["Resp"],

        "hr_start": first["HR"],
        "hr_end": last["HR"],

        "spo2_start": first["O2Sat"],
        "spo2_end": last["O2Sat"],

        "sbp_start": first["SBP"],
        "sbp_end": last["SBP"],

        "resp_start": first["Resp"],
        "resp_end": last["Resp"],

        "temp_start": first["Temp"],
        "temp_end": last["Temp"],
    }


def main():

    files = []

    for directory in DATA_DIRS:
        files.extend(directory.glob("*.psv"))

    print(f"Total patient files: {len(files):,}")

    results = []

    for index, file_path in enumerate(files, start=1):

        result = analyze_patient(file_path)

        if result is not None:
            results.append(result)

        if index % 5000 == 0:
            print(f"Processed: {index:,}")

    result_df = pd.DataFrame(results)

    output_path = Path("data/deterioration_analysis.csv")

    result_df.to_csv(output_path, index=False)

    print()
    print("========== ANALYSIS ==========")
    print(f"Patients with usable event windows: {len(result_df):,}")
    print(f"Output: {output_path}")

    print()
    print("Average changes before event:")

    for column in [
        "hr_change",
        "spo2_change",
        "temp_change",
        "sbp_change",
        "dbp_change",
        "resp_change",
    ]:
        print(
            f"{column:15} "
            f"{result_df[column].mean():.2f}"
        )


if __name__ == "__main__":
    main()