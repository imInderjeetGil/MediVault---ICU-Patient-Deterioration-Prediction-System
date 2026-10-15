import { useEffect, useState } from "react";
import { getPatients } from "../api/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, []);

  const admittedPatients = patients.filter(
    (patient) => patient.status === "admitted"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
              M
            </div>

            <div>
              <h1 className="font-semibold">
                MediVault
              </h1>

              <p className="text-xs text-slate-500">
                ICU Clinical Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            System Online
          </div>

        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-400">
            ICU MONITORING
          </p>

          <h2 className="text-3xl font-bold tracking-tight">
            Patient Overview
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Monitor patients currently admitted to the intensive care unit.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Patients
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {patients.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Currently Admitted
              </p>

              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>

            <p className="mt-2 text-3xl font-semibold">
              {admittedPatients}
            </p>
          </div>

        </div>

        {/* Patient section */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div>
              <h3 className="font-semibold">
                ICU Patients
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Current patient registry
              </p>
            </div>

            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
              {patients.length} Patients
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading patients...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="m-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">
                      Patient
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Patient ID
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Age / Gender
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Room
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Admission
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">

                  {patients.map((patient) => (
                    <tr
  key={patient.id}
  onClick={() => navigate(`/patients/${patient.id}`)}
  className="cursor-pointer transition hover:bg-slate-800/40"
>

                      {/* Patient */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400">
                            {patient.first_name?.[0]}
                            {patient.last_name?.[0]}
                          </div>

                          <div>
                            <p className="font-medium text-slate-200">
                              {patient.first_name} {patient.last_name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              ICU Patient
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* Patient code */}
                      <td className="px-6 py-5 text-sm text-slate-400">
                        {patient.patient_code}
                      </td>

                      {/* Demographics */}
                      <td className="px-6 py-5 text-sm text-slate-400">
                        {patient.age} ·{" "}
                        <span className="capitalize">
                          {patient.gender}
                        </span>
                      </td>

                      {/* Room */}
                      <td className="px-6 py-5">
                        <span className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300">
                          {patient.room_number}
                        </span>
                      </td>

                      {/* Admission */}
                      <td className="px-6 py-5 text-sm text-slate-400">
                        {new Date(
                          patient.admission_time
                        ).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium capitalize text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                          {patient.status}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && patients.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500">
              No patients found.
            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default Dashboard;