import numpy as np
import xgboost as xgb


MODEL_PATH = "models/demo_risk_model.json"

FEATURES = [
    "heart_rate",
    "spo2",
    "systolic_bp",
    "diastolic_bp",
    "respiratory_rate",
    "temperature",
]


model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)


def test_case(name, values):

    X = np.array([[
        values["heart_rate"],
        values["spo2"],
        values["systolic_bp"],
        values["diastolic_bp"],
        values["respiratory_rate"],
        values["temperature"],
    ]])

    probabilities = model.predict_proba(X)[0]

    prediction = int(np.argmax(probabilities))

    levels = {
        0: "LOW",
        1: "MEDIUM",
        2: "HIGH",
    }

    print(f"\n{name}")
    print("-" * 40)
    print(f"LOW:    {probabilities[0]:.2%}")
    print(f"MEDIUM: {probabilities[1]:.2%}")
    print(f"HIGH:   {probabilities[2]:.2%}")
    print(f"RESULT: {levels[prediction]}")


# ----------------------------------------
# 1. Stable
# ----------------------------------------

test_case(
    "STABLE PATIENT",
    {
        "heart_rate": 75,
        "spo2": 98,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "respiratory_rate": 18,
        "temperature": 37.0,
    },
)


# ----------------------------------------
# 2. Early deterioration
# ----------------------------------------

test_case(
    "EARLY DETERIORATION",
    {
        "heart_rate": 100,
        "spo2": 93,
        "systolic_bp": 108,
        "diastolic_bp": 68,
        "respiratory_rate": 25,
        "temperature": 37.7,
    },
)


# ----------------------------------------
# 3. Severe deterioration
# ----------------------------------------

test_case(
    "SEVERE DETERIORATION",
    {
        "heart_rate": 122,
        "spo2": 86,
        "systolic_bp": 94,
        "diastolic_bp": 58,
        "respiratory_rate": 34,
        "temperature": 38.4,
    },
)


# ----------------------------------------
# 4. Respiratory deterioration
# ----------------------------------------

test_case(
    "RESPIRATORY DETERIORATION",
    {
        "heart_rate": 90,
        "spo2": 87,
        "systolic_bp": 118,
        "diastolic_bp": 76,
        "respiratory_rate": 32,
        "temperature": 37.2,
    },
)


# ----------------------------------------
# 5. Circulatory deterioration
# ----------------------------------------

test_case(
    "CIRCULATORY DETERIORATION",
    {
        "heart_rate": 120,
        "spo2": 96,
        "systolic_bp": 88,
        "diastolic_bp": 55,
        "respiratory_rate": 22,
        "temperature": 37.1,
    },
)