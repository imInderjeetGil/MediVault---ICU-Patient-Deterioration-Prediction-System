
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPatient, getPatientLabs } from "../api/api";

function LaboratoryResults() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [patientData, labData] = await Promise.all([
    getPatient(id),
    getPatientLabs(id),
]);

console.log("URL patient ID:", id);
console.log("Patient from Directus:", patientData);
console.log("Labs from Directus:", labData);

        if (!cancelled) {
          setPatient(patientData);
          setLabs(labData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load laboratory results.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const tests = [
    ["Hemoglobin", "hemoglobin", "g/dL"],
    ["White Blood Cell Count", "white_blood_cell_count", "×10⁹/L"],
    ["Platelets", "platelets", "×10⁹/L"],
    ["Creatinine", "creatinine", "mg/dL"],
    ["Lactate", "lactate", "mmol/L"],
    ["Glucose", "glucose", "mg/dL"],
    ["Sodium", "sodium", "mmol/L"],
    ["Potassium", "potassium", "mmol/L"],
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060d18] text-slate-400">
        Loading laboratory results...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060d18] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate(`/patients/${id}`)}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Patient
        </button>

        <div className="mb-6">
          <p className="text-sm text-blue-400">MediVault · Clinical Data</p>
          <h1 className="mt-2 text-2xl font-semibold">
            Laboratory Results
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {patient
              ? `${patient.first_name} ${patient.last_name} · ${patient.patient_code}`
              : "Patient laboratory records"}
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
            {error}
          </div>
        ) : labs.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0a1525] p-8 text-center">
            <p className="font-medium">No laboratory results found</p>
            <p className="mt-2 text-sm text-slate-500">
              No lab records are available for this patient yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {labs.map((lab) => (
              <section
                key={lab.id}
                className="rounded-2xl border border-slate-800 bg-[#0a1525] p-5"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <h2 className="font-semibold">Lab Report</h2>
                  <span className="text-xs text-slate-400">
                    {lab.timestamp
                      ? new Date(lab.timestamp).toLocaleString()
                      : "Date unavailable"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {tests.map(([label, field, unit]) => (
                    <div
                      key={field}
                      className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4"
                    >
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-2 text-xl font-semibold">
                        {lab[field] ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {lab[field] != null ? unit : "No value"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default LaboratoryResults;
