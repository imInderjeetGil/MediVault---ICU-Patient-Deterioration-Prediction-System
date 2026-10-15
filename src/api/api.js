const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;

export async function loginUser(email, password) {
  const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Login failed");
  }

  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${DIRECTUS_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.message || "Failed to get user");
  }

  return data;
}

export async function getPatients() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${DIRECTUS_URL}/items/patients`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to fetch patients"
    );
  }

  return data.data;
}

export async function getPatient(patientId) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${DIRECTUS_URL}/items/patients/${patientId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to fetch patient"
    );
  }

  return data.data;
}

export async function getPatientVitals(patientId) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${DIRECTUS_URL}/items/vitals?filter[patient_id][_eq]=${patientId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to fetch vitals"
    );
  }

  return data.data;
}

export function subscribeToPatientVitals(patientId, onUpdate) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found");
  }

  const websocketUrl = DIRECTUS_URL.replace(/^http/, "ws") + "/websocket";

  const socket = new WebSocket(websocketUrl);

  socket.addEventListener("open", () => {
    console.log("Directus WebSocket connected");

    socket.send(
      JSON.stringify({
        type: "auth",
        access_token: token,
      })
    );
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    console.log("Directus WebSocket:", message);

    // Authentication successful
    if (
      message.type === "auth" &&
      message.status === "ok"
    ) {
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
              patient_id: {
                _eq: patientId,
              },
            },
          },
        })
      );

      console.log("Subscribed to patient vitals");
    }

    // New / updated vital
    if (
  message.type === "subscription" &&
  message.data
) {
  const data = message.data;

  if (Array.isArray(data)) {
    data.forEach((vital) => {
      onUpdate(vital);
    });
  } else {
    onUpdate(data);
  }
}

    // Directus heartbeat
    if (message.type === "ping") {
      socket.send(
        JSON.stringify({
          type: "pong",
        })
      );
    }
  });

  socket.addEventListener("error", (error) => {
    console.error("Directus WebSocket error:", error);
  });

  socket.addEventListener("close", () => {
    console.log("Directus WebSocket disconnected");
  });

  return socket;
}

export function subscribeToPatientRisk(patientId, onUpdate) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found");
  }

  const websocketUrl =
    DIRECTUS_URL.replace(/^http/, "ws") + "/websocket";

  const socket = new WebSocket(websocketUrl);

  socket.addEventListener("open", () => {
    console.log("Risk WebSocket connected");

    socket.send(
      JSON.stringify({
        type: "auth",
        access_token: token,
      })
    );
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    console.log("Risk WebSocket:", message);

    if (
      message.type === "auth" &&
      message.status === "ok"
    ) {
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
              patient_id: {
                _eq: patientId,
              },
            },
          },
        })
      );

      console.log("Subscribed to patient risk predictions");
    }

    if (
      message.type === "subscription" &&
      message.data
    ) {
      const data = message.data;

      if (Array.isArray(data)) {
        data.forEach((prediction) => {
          onUpdate(prediction);
        });
      } else {
        onUpdate(data);
      }
    }

    if (message.type === "ping") {
      socket.send(
        JSON.stringify({
          type: "pong",
        })
      );
    }
  });

  socket.addEventListener("error", (error) => {
    console.error("Risk WebSocket error:", error);
  });

  socket.addEventListener("close", () => {
    console.log("Risk WebSocket disconnected");
  });

  return socket;
}

export async function createVital(vital) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${DIRECTUS_URL}/items/vitals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(vital),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to create vital"
    );
  }

  return data.data;
}

const RISK_API_URL =
  import.meta.env.VITE_RISK_API_URL || "http://localhost:8000";

export async function predictPatientRisk(patientId) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(
    `${RISK_API_URL}/predict/${patientId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail?.message ||
      data.detail ||
      "Failed to calculate patient risk"
    );
  }

  return data;
}

export async function getLatestRiskPrediction(patientId) {
  const token = localStorage.getItem("access_token");

  const url =
    `${DIRECTUS_URL}/items/risk_predictions` +
    `?filter[patient_id][_eq]=${patientId}` +
    `&sort=-timestamp` +
    `&limit=1`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const data = await response.json();

  console.log("Latest risk response:", data);

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to fetch risk prediction"
    );
  }

  return data.data?.[0] || null;
}
