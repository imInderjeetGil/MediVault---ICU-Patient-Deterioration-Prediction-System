<div align="center">

# MediVault

### ICU Patient Deterioration Prediction System

A full-stack clinical intelligence prototype that combines patient records, live vital-sign monitoring, and machine-learning-based deterioration risk prediction in one dashboard.

<p>
  <a href="https://github.com/imInderjeetGil/MediVault---ICU-Patient-Deterioration-Prediction-System">Repository</a> ·
  <a href="https://github.com/imInderjeetGil/MediVault---ICU-Patient-Deterioration-Prediction-System/issues">Report a Bug</a> ·
  <a href="https://github.com/imInderjeetGil/MediVault---ICU-Patient-Deterioration-Prediction-System/issues">Request a Feature</a>
</p>

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/ML-Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-EC6C00?style=for-the-badge)
![Directus](https://img.shields.io/badge/Data-Directus-6644FF?style=for-the-badge&logo=directus&logoColor=white)

</div>

---

## Overview

**MediVault** is an ICU-focused clinical monitoring and early-warning prototype. It gives healthcare teams a centralized interface for reviewing patient information, monitoring physiological signals, exploring clinical records, and generating deterioration-risk predictions.

The system combines:

- A React and Vite web application
- Directus-powered authentication and clinical data APIs
- Real-time WebSocket subscriptions for vitals and risk predictions
- A FastAPI risk engine powered by an XGBoost classification model
- A Python machine-learning workflow for dataset preparation, training, and evaluation

> **Monitor the signals. Understand the risk. Support faster clinical review.**

> **Important:** MediVault is a hackathon/demo prototype and is not a certified medical device. It must not be used to diagnose, treat, or make real-world clinical decisions. Predictions and alerts require rigorous clinical validation before any production or patient-facing use.

---

## Features

### Secure clinical workspace

- Directus-based login and authenticated API requests
- Protected application routes for dashboard and patient workflows
- Session expiry handling with automatic redirect to login
- Token-based communication between the frontend, Directus, and risk service

### ICU dashboard

- Patient registry with search and status-based filtering
- Patient identifiers, room information, admission details, and current status
- Quick navigation to patient monitoring and clinical records
- Doctor-oriented workflow for reviewing multiple patients from one screen

### Patient monitoring

- Heart rate
- Respiratory rate
- Systolic and diastolic blood pressure
- Oxygen saturation (SpO₂)
- Temperature
- Recent vital readings and patient-specific trend views
- Real-time vital updates through Directus WebSockets

### Clinical records

- Laboratory results
- Medication records, including dose, unit, route, timing, and status
- Clinical observations with timestamps, types, values, and notes
- Patient-specific record views for contextual clinical review

### Deterioration risk prediction

- Manual prediction endpoint for supplied vital readings
- Patient-level prediction using the latest 24 vital readings from Directus
- Feature generation from six physiological signals
- XGBoost classification into `LOW`, `MEDIUM`, and `HIGH` risk levels
- Risk score and model version tracking
- Prediction persistence in the Directus `risk_predictions` collection
- Live risk-prediction subscriptions for patient views

### Machine-learning workflow

The `ml/` directory contains scripts for:

- Dataset analysis
- Deterioration dataset construction
- Feature testing
- Model training and experimentation
- Model evaluation
- Demo-model validation

---

## System Architecture

```text
┌──────────────────────────┐
│       Doctor Browser     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      React + Vite UI     │
│ Dashboard / Patients     │
│ Vitals / Labs / Records  │
└───────┬──────────┬───────┘
        │          │
   REST API    WebSocket
        │          │
        ▼          ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│        Directus          │◄──────►│   FastAPI Risk Engine    │
│ Auth + Clinical Data API │       │ XGBoost Inference         │
└────────────┬─────────────┘       └────────────┬─────────────┘
             │                                  │
             ▼                                  ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│        PostgreSQL        │       │   Saved Model Artifacts   │
│ Clinical Data Storage    │       │ XGBoost + Joblib Features │
└──────────────────────────┘       └──────────────────────────┘
```

### Prediction flow

```text
Patient vitals in Directus
          │
          ▼
FastAPI fetches the latest readings
          │
          ▼
Feature preparation and column alignment
          │
          ▼
XGBoost probability prediction
          │
          ▼
LOW / MEDIUM / HIGH risk classification
          │
          ▼
Prediction saved to Directus
          │
          ▼
Risk displayed in the patient dashboard
```

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, JavaScript |
| Styling | CSS |
| Data API | Directus |
| Database | PostgreSQL through Directus |
| Risk API | FastAPI, Pydantic, Uvicorn-compatible ASGI deployment |
| Machine Learning | Python, pandas, NumPy, scikit-learn, XGBoost, joblib, SHAP |
| Real-time updates | Directus WebSockets |
| Authentication | Directus authentication with bearer tokens |

---

## Repository Structure

```text
.
├── ml/
│   ├── models/
│   │   ├── demo_risk_model.json
│   │   └── demo_feature_columns.joblib
│   ├── analyze_dataset.py
│   ├── build_deterioration_dataset.py
│   ├── evaluate_model.py
│   ├── feature_test.py
│   ├── main.py
│   ├── requirements.txt
│   ├── test_demo_model.py
│   ├── train.py
│   ├── train_demo_model.py
│   └── train_v2.py
├── public/
├── src/
│   ├── api/
│   │   └── api.js
│   ├── components/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── LaboratoryResults.jsx
│   │   ├── Login.jsx
│   │   ├── Medications.jsx
│   │   ├── Observations.jsx
│   │   ├── Patient.jsx
│   │   └── Simulation.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A configured Directus instance
- PostgreSQL for a local Directus deployment
- Git

### 1. Clone the repository

```bash
git clone https://github.com/imInderjeetGil/MediVault---ICU-Patient-Deterioration-Prediction-System.git
cd MediVault---ICU-Patient-Deterioration-Prediction-System
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure frontend environment variables

Create a `.env` file in the project root:

```env
VITE_DIRECTUS_URL=http://localhost:8055
VITE_RISK_API_URL=http://localhost:8000
```

Set these values to the URLs of your own services. Do not commit secrets, private keys, database credentials, or administrator tokens.

### 4. Start the frontend

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

### 5. Install machine-learning dependencies

```bash
cd ml
python -m venv .venv
```

Activate the environment:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install the Python requirements:

```bash
pip install -r requirements.txt
```

### 6. Start the risk engine

From the `ml/` directory, run:

```bash
uvicorn main:app --reload --port 8000
```

The health endpoint is available at:

```text
http://localhost:8000/
```

The service reports the loaded model and running status from its root endpoint.

---

## API Endpoints

### Risk engine

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Risk-engine health check |
| `POST` | `/predict` | Predict risk from a supplied list of vital readings |
| `POST` | `/predict/{patient_id}` | Fetch a patient's latest vitals, calculate risk, and save the prediction |

### Frontend environment

| Variable | Purpose |
| --- | --- |
| `VITE_DIRECTUS_URL` | Base URL for the Directus API and WebSocket connection |
| `VITE_RISK_API_URL` | Base URL for the FastAPI risk engine |

---

## Directus Collections

The frontend and risk engine expect a Directus schema containing collections similar to the following:

| Collection | Purpose |
| --- | --- |
| `patients` | Patient identity, room, admission, and status information |
| `vitals` | Timestamped physiological readings |
| `labs` | Laboratory measurements |
| `medications` | Medication names, doses, routes, timing, and status |
| `observations` | Clinical notes and observations |
| `risk_predictions` | Risk score, risk level, model version, timestamp, and status |

At minimum, the `vitals` collection should support:

- `patient_id`
- `timestamp`
- `heart_rate`
- `respiratory_rate`
- `systolic_bp`
- `diastolic_bp`
- `spo2`
- `temperature`

Field names, permissions, and relationships must match the Directus configuration used by your deployment.

---

## Development Commands

From the project root:

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

From the `ml/` directory:

```bash
python main.py                 # Run the FastAPI module directly if configured
python analyze_dataset.py      # Inspect source data
python build_deterioration_dataset.py
python train.py                # Train the primary model workflow
python train_v2.py             # Run the V2 training workflow
python evaluate_model.py       # Evaluate model performance
```

Review each script's input paths and configuration before running the machine-learning workflow.

---

## Model Notes

The current risk engine uses an XGBoost classifier and the following physiological inputs:

- Heart rate
- SpO₂
- Systolic blood pressure
- Diastolic blood pressure
- Respiratory rate
- Temperature

The model maps predictions to three demonstration categories:

```text
0 → LOW
1 → MEDIUM
2 → HIGH
```

The bundled model artifacts are intended for demonstration and development. Before any clinical or operational use, the model must be independently validated for data quality, calibration, bias, robustness, drift, and clinical relevance.

Recommended validation areas:

- Missing and invalid vital readings
- Out-of-range physiological values
- Data freshness and timestamp ordering
- Patient identity and prediction linkage
- Model performance on representative populations
- Alert thresholds and false-positive/false-negative trade-offs
- Service failure and degraded-mode behavior
- Auditability and model-version traceability

---

## Security and Privacy

MediVault works with data shaped like sensitive clinical information. For any deployment:

- Use HTTPS for all non-local traffic.
- Never commit `.env` files, access tokens, passwords, or private keys.
- Use least-privilege Directus roles and service accounts.
- Restrict access to patient records and prediction data.
- Use synthetic or properly de-identified data in demos and screenshots.
- Do not expose a public Directus administrator account.
- Configure audit logging, backups, and monitoring before handling real patient data.
- Review CORS, authentication, WebSocket permissions, and API authorization before deployment.

A prototype is not automatically compliant with HIPAA or any other healthcare privacy, security, or medical-device regulation.

---

## Roadmap

- [ ] Add a polished alerts and triage view
- [ ] Add patient and cohort analytics
- [ ] Improve loading, empty, and error states across all pages
- [ ] Add automated frontend and API tests
- [ ] Add model metrics and explainability views
- [ ] Add robust input validation for vital readings
- [ ] Add production-ready configuration instead of hard-coded service URLs
- [ ] Add Docker and deployment documentation
- [ ] Document the dataset, feature schema, and model evaluation results
- [ ] Complete security and privacy review before any real-data deployment

---

## Contributing

Contributions are welcome.

1. Create a feature branch.
2. Keep changes focused and documented.
3. Do not commit secrets or real patient information.
4. Test relevant frontend and API workflows.
5. Run `npm run lint` and `npm run build` before opening a pull request.
6. Include screenshots or implementation notes for meaningful UI changes.

```bash
git checkout -b feature/your-feature-name
npm run lint
npm run build
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

---

## License

No license has been specified yet. Add a `LICENSE` file before distributing this project as open source.

---

<div align="center">

Built for ICU early-detection and clinical intelligence experimentation.

**MediVault — Clinical visibility with risk-aware monitoring.**

</div>
