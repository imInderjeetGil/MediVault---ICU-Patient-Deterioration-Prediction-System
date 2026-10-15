import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPatient, getPatientMedications } from "../api/api";

export default function Medications() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMedications() {
      try {
        setLoading(true);
        setError("");

        const [patientData, medicationData] = await Promise.all([
          getPatient(id),
          getPatientMedications(id),
        ]);

        setPatient(patientData);
        setMedications(medicationData);
      } catch (err) {
        setError(err.message || "Failed to load medications.");
      } finally {
        setLoading(false);
      }
    }

    loadMedications();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-300">
        Loading medications...
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

        <div className="mb-8">
          <p className="text-sm text-slate-400">Patient Clinical Records</p>
          <h1 className="mt-2 text-3xl font-semibold">Medications</h1>
          <p className="mt-2 text-slate-400">
            {patient?.first_name} {patient?.last_name}
            {patient?.patient_code ? ` · ${patient.patient_code}` : ""}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total medication records</p>
          <p className="mt-2 text-3xl font-semibold">
            {medications.length}
          </p>
        </div>

        {medications.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-lg font-medium">No medications found</h2>
            <p className="mt-2 text-sm text-slate-400">
              No medication records are available for this patient.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {medications.map((medication) => (
              <div
                key={medication.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {medication.medication_name || "Unnamed medication"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {medication.dose ?? "—"} {medication.unit || ""}
                      {medication.route ? ` · ${medication.route}` : ""}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      medication.status?.toLowerCase() === "active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {medication.status || "Unknown"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Start Time</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {medication.start_time
                        ? new Date(medication.start_time).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">End Time</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {medication.end_time
                        ? new Date(medication.end_time).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}