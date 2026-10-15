import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPatient,
  getPatientVitals,
  getPatientLabs,
  subscribeToPatientVitals,
  subscribeToPatientRisk,
} from "../api/api";

import PatientHeader from "../components/patient/PatientHeader";

function Patient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [riskPrediction, setRiskPrediction] = useState(null);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labsError, setLabsError] = useState("");
  const [showLabs, setShowLabs] = useState(false);

  useEffect(() => {
    async function loadPatient() {
      try {
        const patientData = await getPatient(id);
        const vitalsData = await getPatientVitals(id);

        setPatient(patientData);
        setVitals(vitalsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [id]);

  // Live vitals
  useEffect(() => {
    if (!id) return;

    const socket = subscribeToPatientVitals(id, (newVital) => {
      console.log("LIVE VITAL UPDATE:", newVital);

      setVitals((currentVitals) => {
        const existingIndex = currentVitals.findIndex(
          (vital) => vital.id === newVital.id
        );

        if (existingIndex === -1) {
          return [...currentVitals, newVital];
        }

        const updatedVitals = [...currentVitals];
        updatedVitals[existingIndex] = newVital;

        return updatedVitals;
      });
    });

    return () => {
      socket.close();
    };
  }, [id]);

  // Live risk
  useEffect(() => {
    if (!id) return;

    const socket = subscribeToPatientRisk(id, (prediction) => {
      console.log("LIVE RISK UPDATE:", prediction);
      setRiskPrediction(prediction);
    });

    return () => {
      socket.close();
    };
  }, [id]);

  useEffect(() => {
  let cancelled = false;

  async function loadLabs() {
    setLabsLoading(true);
    setLabsError("");

    try {
      const data = await getPatientLabs(id);

      if (!cancelled) {
        setLabs(data);
      }
    } catch (err) {
      if (!cancelled) {
        setLabsError(err.message || "Failed to load laboratory results.");
      }
    } finally {
      if (!cancelled) {
        setLabsLoading(false);
      }
    }
  }

  if (id) loadLabs();

  return () => {
    cancelled = true;
  };
}, [id]);
  
const latestVitals = useMemo(() => {
    if (!vitals.length) return null;

    return [...vitals].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  }, [vitals]);

  const recentVitals = useMemo(() => {
    return [...vitals]
      .sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )
      .slice(0, 5);
  }, [vitals]);

  const riskFactors = useMemo(() => {
  return getRiskFactors(latestVitals);
}, [latestVitals]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060d18] text-slate-400">
        Loading patient...
      </main>
    );
  }

  if (error || !patient) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060d18] text-red-400">
        {error || "Patient not found"}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060d18] text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#08111f]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold">
              M
            </div>

            <div>
              <p className="font-semibold">MediVault</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                ICU Early Detection
              </p>
            </div>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20 text-xs font-semibold text-blue-400">
            DR
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-7">

        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-7 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Patients
        </button>

        {/* Patient Header */}
        <PatientHeader patient={patient} />

        {/* Main Grid */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_360px]">

          {/* LEFT */}
          <div className="space-y-5">

            {/* Live Vitals */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1525]">

              <div className="flex flex-col justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />

                  <div>
                    <h2 className="font-semibold">
                      Live Vital Signs
                    </h2>

                    <p className="text-xs text-slate-500">
                      {latestVitals
                        ? `Last updated ${formatDateTime(
                            latestVitals.timestamp
                          )}`
                        : "Waiting for measurements"}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  LIVE
                </span>
              </div>

              {!latestVitals ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  No vital measurements available.
                </div>
              ) : (
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-800 sm:grid-cols-5 sm:divide-y-0">
                  <VitalTile
                    label="Heart Rate"
                    value={latestVitals.heart_rate}
                    unit="bpm"
                  />

                  <VitalTile
                    label="Blood Pressure"
                    value={`${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}`}
                    unit="mmHg"
                  />

                  <VitalTile
                    label="SpO₂"
                    value={latestVitals.spo2}
                    unit="%"
                  />

                  <VitalTile
                    label="Respiratory"
                    value={latestVitals.respiratory_rate}
                    unit="/min"
                  />

                  <VitalTile
                    label="Temperature"
                    value={latestVitals.temperature}
                    unit="°C"
                  />
                </div>
              )}
            </section>

            {/* Trend */}
            <section className="rounded-2xl border border-slate-800 bg-[#0a1525] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Vital Signs Trend
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Heart rate over available readings
                  </p>
                </div>

                <span className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400">
                  All readings
                </span>
              </div>

              <div className="mt-5">
                <HeartRateChart vitals={vitals} />
              </div>
            </section>
            
            {/* Recent Readings */}
            <section className="rounded-2xl border border-slate-800 bg-[#0a1525]">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="font-semibold">
                  Recent Readings
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Latest physiological measurements
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr className="border-b border-slate-800">
                      <th className="px-5 py-3 font-medium">Time</th>
                      <th className="px-5 py-3 font-medium">HR</th>
                      <th className="px-5 py-3 font-medium">BP</th>
                      <th className="px-5 py-3 font-medium">SpO₂</th>
                      <th className="px-5 py-3 font-medium">RR</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentVitals.map((vital) => (
                      <tr
                        key={vital.id}
                        className="border-b border-slate-800/70 last:border-0"
                      >
                        <td className="px-5 py-3 text-slate-400">
                          {new Date(vital.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="px-5 py-3 text-slate-200">
                          {vital.heart_rate}
                        </td>

                        <td className="px-5 py-3 text-slate-200">
                          {vital.systolic_bp}/{vital.diastolic_bp}
                        </td>

                        <td className="px-5 py-3 text-slate-200">
                          {vital.spo2}%
                        </td>

                        <td className="px-5 py-3 text-slate-200">
                          {vital.respiratory_rate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-5">

            {/* Patient Details */}
            <section className="rounded-2xl border border-slate-800 bg-[#0a1525] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  Patient Details
                </h2>

                <span className="text-xs text-slate-600">
                  #{patient.patient_code}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <DetailRow
                  label="Patient ID"
                  value={patient.patient_code}
                />

                <DetailRow
                  label="Full Name"
                  value={`${patient.first_name} ${patient.last_name}`}
                />

                <DetailRow
                  label="Age / Gender"
                  value={`${patient.age} years · ${capitalize(
                    patient.gender
                  )}`}
                />

                <DetailRow
                  label="Room"
                  value={patient.room_number}
                />

                <DetailRow
                  label="Admission"
                  value={formatDateTime(patient.admission_time)}
                />
              </div>
            </section>

            {/* Clinical Data */}
            <section className="rounded-2xl border border-slate-800 bg-[#0a1525] p-5">
              <h2 className="font-semibold">
                Clinical Data
              </h2>

              <div className="mt-4 space-y-2">
                <ClinicalLink
  title="Laboratory Results"
  subtitle="View patient labs"
  onClick={() => navigate(`/patients/${id}/labs`)}
/>

                <ClinicalLink
  title="Medications"
  subtitle="View patient medications"
  onClick={() => navigate(`/patients/${id}/medications`)}
/>

                <ClinicalLink
  title="Observations"
  subtitle="View clinical notes"
  onClick={() => navigate(`/patients/${id}/observations`)}
/>
              </div>
            </section>

            {/* Alerts */}
<section className="rounded-2xl border border-slate-800 bg-[#0a1525] p-5">
  <div className="flex items-center gap-2">
    <span
      className={`h-2 w-2 rounded-full ${
        riskPrediction?.risk_level === "HIGH"
          ? "animate-pulse bg-red-500"
          : riskPrediction?.risk_level === "MEDIUM"
          ? "bg-yellow-400"
          : "bg-emerald-400"
      }`}
    />

    <h2 className="font-semibold">
      Alerts
    </h2>
  </div>

  {!riskPrediction ? (
    <p className="mt-4 text-sm text-slate-500">
      Waiting for risk assessment...
    </p>
  ) : riskPrediction.risk_level === "HIGH" ? (
    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
      <p className="text-sm font-semibold text-red-400">
        High Risk Detected
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        Patient shows signs of significant physiological deterioration.
        Immediate clinical review is recommended.
      </p>

      <p className="mt-3 text-xs text-red-400">
        Risk Score: {(riskPrediction.risk_score * 100).toFixed(1)}%
      </p>
      {riskFactors.length > 0 && (
  <div className="mt-4 space-y-2 border-t border-red-500/10 pt-3">
    <p className="text-xs font-medium text-slate-400">
      Contributing factors
    </p>

    {riskFactors.map((factor) => (
      <div
        key={factor.label}
        className="flex items-center justify-between text-xs"
      >
        <span className="text-slate-500">
          {factor.label}
        </span>

        <span className="font-medium text-red-400">
          {factor.value} {factor.direction}
        </span>
      </div>
    ))}
  </div>
)}
    </div>
  ) : riskPrediction.risk_level === "MEDIUM" ? (
    <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
      <p className="text-sm font-semibold text-yellow-400">
        Elevated Risk
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        Patient shows early signs of physiological deterioration.
        Continue monitoring.
      </p>

      <p className="mt-3 text-xs text-yellow-400">
        Risk Score: {(riskPrediction.risk_score * 100).toFixed(1)}%
      </p>
    </div>
  ) : (
    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
      <p className="text-sm font-semibold text-emerald-400">
        No Active Alert
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Current physiological readings are within the stable simulation range.
      </p>
    </div>
  )}
</section>

          </aside>
        </div>
      </div>
    </main>
  );
}

function VitalTile({ label, value, unit }) {
  return (
    <div className="p-4 sm:p-5">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight">
          {value ?? "—"}
        </span>

        <span className="text-xs text-slate-500">
          {unit}
        </span>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm text-slate-300">
        {value || "—"}
      </span>
    </div>
  );
}


function ClinicalLink({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900"
    >
      <div>
        <p className="text-sm text-slate-300">{title}</p>
        <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
      </div>
      <span className="text-slate-600 transition group-hover:text-blue-400">
        →
      </span>
    </button>
  );
}


function getRiskFactors(vitals) {
  if (!vitals) return [];

  const factors = [];

  if (Number(vitals.spo2) < 92) {
    factors.push({
      label: "SpO₂",
      value: `${vitals.spo2}%`,
      direction: "↓",
    });
  }

  if (Number(vitals.heart_rate) > 100) {
    factors.push({
      label: "Heart Rate",
      value: `${vitals.heart_rate} bpm`,
      direction: "↑",
    });
  }

  if (Number(vitals.systolic_bp) < 100) {
    factors.push({
      label: "Systolic BP",
      value: `${vitals.systolic_bp} mmHg`,
      direction: "↓",
    });
  }

  if (Number(vitals.respiratory_rate) > 24) {
    factors.push({
      label: "Respiratory Rate",
      value: `${vitals.respiratory_rate}/min`,
      direction: "↑",
    });
  }

  if (Number(vitals.temperature) > 38) {
    factors.push({
      label: "Temperature",
      value: `${vitals.temperature}°C`,
      direction: "↑",
    });
  }

  return factors;
}

function StatusBadge({ status }) {
  const isAdmitted = status?.toLowerCase() === "admitted";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        isAdmitted
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-slate-700 bg-slate-800 text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isAdmitted ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />

      {status}
    </span>
  );
}

function HeartRateChart({ vitals }) {
  if (!vitals.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-600">
        No historical readings available.
      </div>
    );
  }

  const readings = [...vitals]
    .sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    )
    .slice(-20);

  const values = readings.map((vital) => Number(vital.heart_rate) || 0);

  const width = 900;
  const height = 240;
  const paddingX = 20;
  const paddingY = 25;

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const range = Math.max(maxValue - minValue, 10);

  const points = values
    .map((value, index) => {
      const x =
        paddingX +
        (index / Math.max(values.length - 1, 1)) *
          (width - paddingX * 2);

      const y =
        height -
        paddingY -
        ((value - minValue) / range) *
          (height - paddingY * 2);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        preserveAspectRatio="none"
      >
        {/* Grid */}
        {[0, 1, 2, 3].map((line) => {
          const y =
            paddingY +
            (line / 3) * (height - paddingY * 2);

          return (
            <line
              key={line}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-slate-800"
              strokeWidth="1"
            />
          );
        })}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          className="text-blue-400"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {values.map((value, index) => {
          const x =
            paddingX +
            (index / Math.max(values.length - 1, 1)) *
              (width - paddingX * 2);

          const y =
            height -
            paddingY -
            ((value - minValue) / range) *
              (height - paddingY * 2);

          return (
            <circle
              key={`${readings[index].id}-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill="currentColor"
              className="text-blue-400"
            />
          );
        })}
      </svg>

      <div className="flex justify-between px-2 text-[10px] text-slate-600">
        <span>
          {formatTime(readings[0]?.timestamp)}
        </span>

        <span>
          {formatTime(readings[readings.length - 1]?.timestamp)}
        </span>
      </div>
    </div>
  );
}

function capitalize(value) {
  if (!value) return "—";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default Patient;