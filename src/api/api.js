
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const RISK_API_URL =
  import.meta.env.VITE_RISK_API_URL || "http://localhost:8000";

// Clear session and redirect to login
function clearSessionAndRedirect() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("expires_at");

  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
}

// Centralized API response handler
async function apiFetch(url, options = {}, fallbackMessage = "Request failed") {
  const response = await fetch(url, options);

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Response may not contain JSON.
  }

  if (response.status === 401) {
    clearSessionAndRedirect();
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.message ||
        data.detail?.message ||
        data.detail ||
        fallbackMessage
    );
  }

  return data;
}

// Login
export async function loginUser(email, password) {
  const data = await apiFetch(
    `${DIRECTUS_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    "Login failed"
  );

  return data;
}

// Current user
export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  return apiFetch(
    `${DIRECTUS_URL}/users/me`,
    { headers: { Authorization: `Bearer ${token}` } },
    "Failed to get user"
  );
}

// Get all patients
export async function getPatients() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const data = await apiFetch(
    `${DIRECTUS_URL}/items/patients`,
    { headers: { Authorization: `Bearer ${token}` } },
    "Failed to fetch patients"
  );

  return data.data;
}

// Get a single patient
export async function getPatient(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const data = await apiFetch(
    `${DIRECTUS_URL}/items/patients/${patientId}`,
    { headers: { Authorization: `Bearer ${token}` } },
    "Failed to fetch patient"
  );

  return data.data;
}

// Get patient vitals
export async function getPatientVitals(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const data = await apiFetch(
    `${DIRECTUS_URL}/items/vitals?filter[patient_id][_eq]=${patientId}`,
    { headers: { Authorization: `Bearer ${token}` } },
    "Failed to fetch vitals"
  );

  return data.data;
}

// Handle WebSocket authentication errors
function handleSocketAuthError(message, socket) {
  if (message.type === "auth" && message.status === "error") {
    clearSessionAndRedirect();
    socket.close();
    return true;
  }

  return false;
}

// Subscribe to live patient vitals
export function subscribeToPatientVitals(patientId, onUpdate) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const websocketUrl = DIRECTUS_URL.replace(/^http/, "ws") + "/websocket";
  const socket = new WebSocket(websocketUrl);

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "auth",
        access_token: token,
      })
    );
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (handleSocketAuthError(message, socket)) return;

    if (message.type === "auth" && message.status === "ok") {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          collection: "vitals",
          query: {
            fields: [
              "id",
              "patient_id",
              "timestamp",
              "heart_rate",
              "respiratory_rate",
              "systolic_bp",
              "diastolic_bp",
              "spo2",
              "temperature",
            ],
            filter: {
              patient_id: { _eq: patientId },
            },
          },
        })
      );
    }

    if (message.type === "subscription" && message.data) {
      const records = Array.isArray(message.data)
        ? message.data
        : [message.data];

      records.forEach(onUpdate);
    }

    if (message.type === "ping") {
      socket.send(JSON.stringify({ type: "pong" }));
    }
  });

  socket.addEventListener("error", (error) => {
    console.error("Directus WebSocket error:", error);
  });

  return socket;
}

// Subscribe to live risk predictions
export function subscribeToPatientRisk(patientId, onUpdate) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const websocketUrl = DIRECTUS_URL.replace(/^http/, "ws") + "/websocket";
  const socket = new WebSocket(websocketUrl);

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "auth",
        access_token: token,
      })
    );
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (handleSocketAuthError(message, socket)) return;

    if (message.type === "auth" && message.status === "ok") {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          collection: "risk_predictions",
          query: {
            fields: [
              "id",
              "patient_id",
              "timestamp",
              "risk_score",
              "risk_level",
              "model_version",
              "prediction_status",
            ],
            filter: {
              patient_id: { _eq: patientId },
            },
          },
        })
      );
    }

    if (message.type === "subscription" && message.data) {
      const records = Array.isArray(message.data)
        ? message.data
        : [message.data];

      records.forEach(onUpdate);
    }

    if (message.type === "ping") {
      socket.send(JSON.stringify({ type: "pong" }));
    }
  });

  socket.addEventListener("error", (error) => {
    console.error("Risk WebSocket error:", error);
  });

  return socket;
}

// Create a vital reading
export async function createVital(vital) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const data = await apiFetch(
    `${DIRECTUS_URL}/items/vitals`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(vital),
    },
    "Failed to create vital"
  );

  return data.data;
}

// Request patient risk prediction
export async function predictPatientRisk(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  return apiFetch(
    `${RISK_API_URL}/predict/${patientId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
    "Failed to calculate patient risk"
  );
}

// Get latest risk prediction
export async function getLatestRiskPrediction(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const url =
    `${DIRECTUS_URL}/items/risk_predictions` +
    `?filter[patient_id][_eq]=${patientId}` +
    `&sort=-timestamp&limit=1`;

  const data = await apiFetch(
    url,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
    "Failed to fetch risk prediction"
  );

  return data.data?.[0] || null;
}

export async function getPatientLabs(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const params = new URLSearchParams({
    "filter[patient_id][_eq]": patientId,
    fields:
      "id,patient_id,timestamp,hemoglobin,white_blood_cell_count,platelets,creatinine,lactate,glucose,sodium,potassium",
    sort: "-timestamp",
    limit: "50",
  });

  const data = await apiFetch(
    `${DIRECTUS_URL}/items/labs?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    "Failed to fetch laboratory results"
  );

  return data.data ?? [];
}

export async function getPatientMedications(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const params = new URLSearchParams({
    "filter[patient_id][_eq]": patientId,
    fields:
      "id,patient_id,medication_name,dose,unit,route,start_time,end_time,status",
    sort: "-start_time",
    limit: "50",
  });

  const data = await apiFetch(
    `${DIRECTUS_URL}/items/medications?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    "Failed to fetch medications"
  );

  return data.data ?? [];
}

export async function getPatientObservations(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    clearSessionAndRedirect();
    throw new Error("Please log in again.");
  }

  const params = new URLSearchParams({
    "filter[patient_id][_eq]": patientId,
    fields: "id,patient_id,timestamp,observation_type,value,notes",
    sort: "-timestamp",
    limit: "50",
  });

  const data = await apiFetch(
    `${DIRECTUS_URL}/items/observations?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    "Failed to fetch observations"
  );

  return data.data ?? [];
}