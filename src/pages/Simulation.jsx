import { useEffect, useState } from "react";
import { getPatients } from "../api/api";
import VitalSimulator from "../components/VitalSimulator";

function Simulation() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await getPatients();

        setPatients(data);

        if (data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, []);

  const selectedPatient = patients.find(
    (patient) => patient.id === selectedPatientId
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060d18] text-slate-400">
        Loading simulation...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060d18] text-slate-100">

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#08111f]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">

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

          <nav className="flex items-center gap-6 text-sm">
            <a
              href="/dashboard"
              className="text-slate-500 transition hover:text-white"
            >
              Patients
            </a>

            <a
              href="/simulation"
              className="text-blue-400"
            >
              Simulation
            </a>

            <a
              href="#"
              className="text-slate-600"
            >
              Alerts
            </a>
          </nav>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20 text-xs font-semibold text-blue-400">
            DR
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 py-8">

        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            DEMONSTRATION ENVIRONMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            ICU Simulation Lab
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Generate realistic ICU vital measurements and observe how
            MediVault responds to changing patient conditions in real time.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Patient Selection */}
        <section className="rounded-2xl border border-slate-800 bg-[#0a1525] p-6">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Simulation Patient
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                Select ICU Patient
              </h2>
            </div>

            <select
              value={selectedPatientId}
              onChange={(event) =>
                setSelectedPatientId(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-blue-500 md:w-96"
            >
              {patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.patient_code} — {patient.first_name}{" "}
                  {patient.last_name} — {patient.room_number}
                </option>
              ))}
            </select>

          </div>

          {selectedPatient && (
            <div className="mt-6 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20 font-semibold text-blue-400">
                {selectedPatient.first_name?.[0]}
                {selectedPatient.last_name?.[0]}
              </div>

              <div>
                <p className="font-medium">
                  {selectedPatient.first_name}{" "}
                  {selectedPatient.last_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedPatient.patient_code}
                  <span className="mx-2">•</span>
                  {selectedPatient.age} years
                  <span className="mx-2">•</span>
                  {selectedPatient.room_number}
                </p>
              </div>

              <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Admitted
              </span>

            </div>
          )}

        </section>

        {/* Simulator */}
        {selectedPatient && (
          <div className="mt-5">
            <VitalSimulator
              patientId={selectedPatient.id}
              latestVitals={null}
            />
          </div>
        )}

        {/* How it works */}
        <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0a1525] p-6">

          <h2 className="font-semibold">
            Live Simulation Flow
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">

            <FlowStep
              number="01"
              title="Generate"
              text="Simulator creates a new vital reading."
            />

            <FlowStep
              number="02"
              title="Store"
              text="Reading is saved as a real Directus record."
            />

            <FlowStep
              number="03"
              title="Stream"
              text="Directus sends the change through WebSocket."
            />

            <FlowStep
              number="04"
              title="Monitor"
              text="Patient dashboard updates without refresh."
            />

          </div>

        </section>

      </div>
    </main>
  );
}

function FlowStep({ number, title, text }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <span className="text-xs font-semibold text-blue-400">
        {number}
      </span>

      <h3 className="mt-3 text-sm font-medium">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}

export default Simulation;