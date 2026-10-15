import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getPatients } from "../api/api";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [patientData, userResponse] = await Promise.all([
          getPatients(),
          getCurrentUser(),
        ]);

        setPatients(patientData ?? []);
        setDoctor(userResponse?.data ?? userResponse);
      } catch (err) {
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const admittedPatients = patients.filter(
    (patient) => patient.status === "admitted"
  ).length;

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const matchesSearch = [
        patient.first_name,
        patient.last_name,
        patient.patient_code,
        patient.room_number,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        patient.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const doctorName =
    [doctor?.first_name, doctor?.last_name]
      .filter(Boolean)
      .join(" ") ||
    doctor?.email?.split("@")[0] ||
    "Doctor";

  const initials =
    [doctor?.first_name?.[0], doctor?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "DR";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold shadow-lg shadow-blue-950/40">
              M
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                MediVault
              </h1>
              <p className="text-xs text-slate-400">
                ICU Clinical Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 text-sm font-semibold text-blue-300">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">
        {/* Welcome section */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-medium text-blue-400">
              {formatDate()}
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {getGreeting()},{" "}
              <span className="text-blue-400">
                Dr. {doctorName}
              </span>
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Here is your ICU overview. Review patient records
              and monitor the latest clinical information.
            </p>
          </div>

          <button
            onClick={() => navigate("/simulation")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 sm:self-auto"
          >
            <span className="text-lg">+</span>
            Open Simulation
          </button>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Overview cards */}
        <section>
          <div className="mb-4">
            <h3 className="font-semibold">ICU Overview</h3>
            <p className="mt-1 text-sm text-slate-500">
              Current patient census
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewCard
              icon="◉"
              label="Assigned Patients"
              value={loading ? "—" : patients.length}
              description="Patient registry"
              accent="blue"
            />

            <OverviewCard
              icon="♥"
              label="Currently Admitted"
              value={loading ? "—" : admittedPatients}
              description="Patients with admitted status"
              accent="emerald"
            />

            <OverviewCard
              icon="⌁"
              label="Other Patient Statuses"
              value={loading ? "—" : patients.length - admittedPatients}
              description="Not currently marked admitted"
              accent="violet"
            />

          </div>
        </section>

        {/* Patient registry */}
        <section
          id="patient-registry"
          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
        >
          <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h3 className="text-lg font-semibold">
                ICU Patient Registry
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Select a patient to view their clinical details.
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300">
              {loading ? "Loading..." : `${filteredPatients.length} patients`}
            </span>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:p-5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                ⌕
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, patient ID or room..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="admitted">Admitted</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Loading patient records...
            </div>
          ) : !error && filteredPatients.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium text-slate-300">
                No matching patients
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another search term or status filter.
              </p>
            </div>
          ) : !error ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Patient</th>
                      <th className="px-6 py-4 font-medium">Patient ID</th>
                      <th className="px-6 py-4 font-medium">Age / Gender</th>
                      <th className="px-6 py-4 font-medium">Room</th>
                      <th className="px-6 py-4 font-medium">Admission</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        onClick={() =>
                          navigate(`/patients/${patient.id}`)
                        }
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            navigate(`/patients/${patient.id}`);
                          }
                        }}
                        className="cursor-pointer transition hover:bg-slate-800/50 focus:bg-slate-800/50 focus:outline-none"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <PatientAvatar patient={patient} />
                            <div>
                              <p className="font-medium text-slate-200">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                ICU Patient
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-400">
                          {patient.patient_code || "—"}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-400">
                          {patient.age ?? "—"} ·{" "}
                          <span className="capitalize">
                            {patient.gender || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300">
                            {patient.room_number || "Unassigned"}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-400">
                          {patient.admission_time
                            ? new Date(
                                patient.admission_time
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td className="px-6 py-5">
                          <PatientStatus status={patient.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile patient cards */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() =>
                      navigate(`/patients/${patient.id}`)
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-blue-500/50"
                  >
                    <div className="flex items-center gap-3">
                      <PatientAvatar patient={patient} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {patient.patient_code} ·{" "}
                          {patient.room_number || "Unassigned"}
                        </p>
                      </div>
                      <PatientStatus status={patient.status} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {patient.age ?? "—"} years ·{" "}
                      {patient.gender || "—"}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-slate-800 pt-5 text-xs text-slate-500 sm:flex-row">
          <p>MediVault · ICU Clinical Intelligence</p>
          <p>Clinical decisions must be based on professional assessment.</p>
        </footer>
      </main>
    </div>
  );
}

function OverviewCard({ icon, label, value, description, accent }) {
  const accents = {
    blue: "bg-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    violet: "bg-violet-500/10 text-violet-400",
    amber: "bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accents[accent]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function QuickAction({ icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:border-blue-500/40 hover:bg-slate-900"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400 transition group-hover:bg-blue-500/20">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-slate-200">
          {title}
        </span>
        <span className="mt-2 block text-sm leading-5 text-slate-400">
          {description}
        </span>
        <span className="mt-3 block text-xs font-medium text-blue-400">
          Open section →
        </span>
      </span>
    </button>
  );
}

function PatientAvatar({ patient }) {
  const initials =
    `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`
      .toUpperCase() || "P";

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/10 bg-blue-500/10 text-sm font-semibold text-blue-300">
      {initials}
    </span>
  );
}

function PatientStatus({ status }) {
  const isAdmitted = status?.toLowerCase() === "admitted";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${
        isAdmitted
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-slate-700 bg-slate-800 text-slate-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isAdmitted ? "bg-emerald-400" : "bg-slate-400"
        }`}
      />
      {status || "Unknown"}
    </span>
  );
}

export default Dashboard;