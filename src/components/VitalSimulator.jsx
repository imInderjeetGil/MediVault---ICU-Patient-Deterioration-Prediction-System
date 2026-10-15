import { useEffect, useRef, useState } from "react";
import {
  createVital,
  predictPatientRisk,
} from "../api/api";

function VitalSimulator({ patientId, latestVitals }) {
  const [scenario, setScenario] = useState("stable");
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [message, setMessage] = useState("");

  const intervalRef = useRef(null);
  const tickRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      generateVital();
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [running, scenario, patientId]);

  async function generateVital() {
    try {
      const currentTick = tickRef.current;

      const vital = generateScenarioVital(
        patientId,
        scenario,
        currentTick,
        latestVitals
      );

      await createVital(vital);

const prediction = await predictPatientRisk(patientId);

console.log("Risk prediction:", prediction);

      tickRef.current += 1;
      setTick(tickRef.current);
      setMessage("New vital recorded");
    } catch (error) {
      console.error(error);
      setMessage(error.message);
      setRunning(false);
    }
  }

  function toggleSimulator() {
    setMessage("");

    if (running) {
      setRunning(false);
      return;
    }

    setRunning(true);
  }

  function resetSimulator() {
    setRunning(false);
    tickRef.current = 0;
    setTick(0);
    setMessage("");
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0a1525] p-5">

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />

            <h2 className="font-semibold">
              ICU Simulator
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Generates real vital records for this patient
          </p>
        </div>

        <div className="flex items-center gap-2">

          <select
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              tickRef.current = 0;
              setTick(0);
            }}
            disabled={running}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none disabled:opacity-50"
          >
            <option value="stable">
              Stable
            </option>

            <option value="deteriorating">
              Deteriorating
            </option>
          </select>

          <button
            onClick={toggleSimulator}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
              running
                ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {running ? "Stop" : "Start"}
          </button>

          <button
            onClick={resetSimulator}
            className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-500 transition hover:text-slate-300"
          >
            Reset
          </button>

        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">

        <div className="flex items-center gap-3">

          <span
            className={`h-2 w-2 rounded-full ${
              running
                ? "animate-pulse bg-emerald-400"
                : "bg-slate-600"
            }`}
          />

          <span className="text-xs text-slate-400">
            {running ? "Simulation running" : "Simulation stopped"}
          </span>

        </div>

        <span className="text-xs text-slate-600">
          Reading #{tick}
        </span>

      </div>

      {message && (
        <p className="mt-3 text-xs text-slate-500">
          {message}
        </p>
      )}

    </section>
  );
}

function generateScenarioVital(
  patientId,
  scenario,
  tick,
  latestVitals
) {
  const base = latestVitals || {
    heart_rate: 72,
    respiratory_rate: 16,
    systolic_bp: 122,
    diastolic_bp: 78,
    spo2: 98,
    temperature: 36.8,
  };

  if (scenario === "deteriorating") {
    return generateDeterioratingVital(patientId, base, tick);
  }

  return generateStableVital(patientId, base);
}

function generateStableVital(patientId, base) {
  return {
    patient_id: patientId,
    timestamp: new Date().toISOString(),

    heart_rate: clamp(
      Math.round(Number(base.heart_rate) + random(-3, 3)),
      65,
      85
    ),

    respiratory_rate: clamp(
      Math.round(Number(base.respiratory_rate) + random(-1, 1)),
      14,
      20
    ),

    systolic_bp: clamp(
      Math.round(Number(base.systolic_bp) + random(-4, 4)),
      110,
      130
    ),

    diastolic_bp: clamp(
      Math.round(Number(base.diastolic_bp) + random(-3, 3)),
      65,
      85
    ),

    spo2: clamp(
      Math.round(Number(base.spo2) + random(-1, 1)),
      96,
      100
    ),

    temperature: Number(
      clamp(
        Number(base.temperature) + random(-0.1, 0.1),
        36.4,
        37.4
      ).toFixed(1)
    ),
  };
}

function generateDeterioratingVital(patientId, base, tick) {
  const progress = Math.min(tick, 12);

  return {
    patient_id: patientId,
    timestamp: new Date().toISOString(),

    heart_rate: Math.round(
      72 + progress * 4 + random(-2, 2)
    ),

    respiratory_rate: Math.round(
      16 + progress * 1.2 + random(-1, 1)
    ),

    systolic_bp: Math.round(
      122 - progress * 2 + random(-3, 3)
    ),

    diastolic_bp: Math.round(
      78 - progress * 1 + random(-2, 2)
    ),

    spo2: Math.round(
      98 - progress * 0.9 + random(-1, 1)
    ),

    temperature: Number(
      (
        36.8 +
        progress * 0.12 +
        random(-0.05, 0.05)
      ).toFixed(1)
    ),
  };
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default VitalSimulator;