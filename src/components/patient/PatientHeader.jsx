function PatientHeader({ patient }) {
  return (
    <section className="mb-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600/90 text-xl font-bold">
          {patient.first_name?.[0]}
          {patient.last_name?.[0]}
        </div>

        <div>
          <p className="text-sm text-blue-400">
            {patient.patient_code}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {patient.first_name} {patient.last_name}
            </h1>

            <StatusBadge status={patient.status} />
          </div>

          <p className="mt-2 text-sm text-slate-400">
            {capitalize(patient.gender)}
            <span className="mx-2 text-slate-700">•</span>
            {patient.age} years
            <span className="mx-2 text-slate-700">•</span>
            {patient.room_number}
          </p>
        </div>
      </div>
    </section>
  );
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

function capitalize(value) {
  if (!value) return "—";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default PatientHeader;