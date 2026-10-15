import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPatient,
  getPatientObservations,
} from "../api/api";

export default function Observations() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadObservations() {
      try {
        setLoading(true);
        setError("");

        const [patientData, observationData] = await Promise.all([
          getPatient(id),
          getPatientObservations(id),
        ]);

        setPatient(patientData);
        setObservations(observationData);
      } catch (err) {
        setError(err.message || "Failed to load observations.");
      } finally {
        setLoading(false);
      }
    }

    loadObservations();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-300">
        Loading observations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-red-400">
        <p>{error}</p>
        <button
          onClick={() => navigate(`/patients/${id}`)}
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-white"
        >
          Back to Patient
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate(`/patients/${id}`)}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Patient
        </button>

        <header className="mb-8">
          <p className="text-sm text-slate-400">
            Patient Clinical Records
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Observations
          </h1>
          <p className="mt-2 text-slate-400">
            {patient?.first_name} {patient?.last_name}
            {patient?.patient_code
              ? ` · ${patient.patient_code}`
              : ""}
          </p>
        </header>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Total observation records
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {observations.length}
          </p>
        </div>

        {observations.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-lg font-medium">
              No observations found
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              No observation records are available for this patient.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {observations.map((observation) => (
              <article
                key={observation.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {(observation.observation_type || "Observation")
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {observation.timestamp
                        ? new Date(observation.timestamp).toLocaleString()
                        : "Time unavailable"}
                    </p>
                  </div>

                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                    {observation.value || "No value"}
                  </span>
                </div>

                {observation.notes && (
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {observation.notes}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}