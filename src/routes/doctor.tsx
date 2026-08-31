import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Pause, PlayCircle, SkipForward, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell, StatCard, StatusPill } from "@/components/mediflow/Shell";
import { calculateWaitTime, getQueueStatus } from "@/lib/mediflow/queue";
import { completePatient, markNoShow, startConsultation, updateDoctorStatus, useMediflow } from "@/lib/mediflow/store";
import type { ScreeningSnapshot } from "@/lib/mediflow/types";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Console — Mediflow Consultation Queue" },
      { name: "description", content: "Doctor console with current patient, next patient, live queue, screening summary and consultation controls." },
      { property: "og:title", content: "Doctor Console — Mediflow" },
      { property: "og:description", content: "Current patient, queue control and patient-provided screening summaries." },
    ],
  }),
  component: DoctorDashboard,
});

function DoctorDashboard() {
  const state = useMediflow((s) => s);
  const doctors = state.doctors.filter((d) => d.hospitalId === state.activeHospitalId);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const doctor = doctors.find((d) => d.id === doctorId) ?? doctors[0];

  if (!doctor) {
    return (
      <DashboardShell title="Doctor console" subtitle="No doctors configured">
        <p className="surface-card p-6 text-sm text-muted-foreground">
          This hospital has no doctors in the demo dataset. Switch hospital from the selector above.
        </p>
      </DashboardShell>
    );
  }

  const { waiting, current, completed, noShows } = getQueueStatus(state.entries, doctor.id);
  const { minutes } = calculateWaitTime(state.entries, doctor);
  const next = waiting[0];

  return (
    <DashboardShell
      title="Doctor console"
      subtitle="Live consultation queue and patient-provided screening summaries."
      actions={
        <Select value={doctor.id} onValueChange={setDoctorId}>
          <SelectTrigger className="w-[220px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
        </Select>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Stethoscope className="size-5" /></span>
                <div>
                  <p className="text-lg font-bold">{doctor.name}</p>
                  <p className="text-sm text-muted-foreground">{doctor.specialization} · {doctor.experience} yrs · ₹{doctor.fee}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={doctor.status} />
                <Select value={doctor.status} onValueChange={(v) => updateDoctorStatus(doctor.id, v as typeof doctor.status)}>
                  <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["AVAILABLE", "IN CONSULTATION", "ON BREAK", "OFFLINE", "FULLY BOOKED"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              <StatCard label="In queue" value={waiting.length} />
              <StatCard label="Est. wait" value={`${minutes} min`} />
              <StatCard label="Completed" value={completed.length} tone="success" />
              <StatCard label="No-shows" value={noShows.length} tone="danger" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PatientPanel
              heading="Current patient"
              token={current?.token}
              name={current?.patientName}
              age={current?.age}
              concern={current?.concern}
              summary={current?.summary}
              screening={current?.screening}
              empty="No consultation in progress."
            />
            <PatientPanel
              heading="Next patient"
              token={next?.token}
              name={next?.patientName}
              age={next?.age}
              concern={next?.concern}
              summary={next?.summary}
              screening={next?.screening}
              empty="Queue is empty."
            />
          </div>

          <div className="surface-card flex flex-wrap gap-2 p-4">
            <Button onClick={() => { startConsultation(doctor.id); toast.success("Consultation started."); }} disabled={!!current || !next}>
              <PlayCircle className="size-4" /> Start consultation
            </Button>
            <Button variant="outline" onClick={() => { completePatient(doctor.id); toast.success("Completed. Queue recalculated."); }} disabled={!current}>
              Complete
            </Button>
            <Button variant="outline" onClick={() => { if (next) { markNoShow(next.id); toast.success(`${next.token} marked as no-show.`); } }} disabled={!next}>
              <SkipForward className="size-4" /> Skip / no-show
            </Button>
            <Button variant="ghost" onClick={() => { updateDoctorStatus(doctor.id, "ON BREAK"); toast.success("Queue paused. Patients see an updated estimate."); }}>
              <Pause className="size-4" /> Pause queue
            </Button>
          </div>
        </div>

        <aside className="surface-card h-fit p-5">
          <h2 className="text-base font-semibold">Today's appointments</h2>
          <div className="mt-3 space-y-2">
            {waiting.slice(0, 10).map((e, i) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{e.token} · {e.patientName}</p>
                  <p className="text-xs text-muted-foreground">{e.concern}</p>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  ~{calculateWaitTime(state.entries, doctor, e.id).minutes} min
                  {i === 0 ? " · next" : ""}
                </span>
              </div>
            ))}
            {waiting.length === 0 && <p className="text-sm text-muted-foreground">No patients waiting.</p>}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function UrgencyBadge({ urgency }: { urgency: ScreeningSnapshot["urgency"] }) {
  return urgency === "urgent" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-destructive">
      <AlertTriangle className="size-3" /> URGENT
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
      Routine
    </span>
  );
}

function PatientPanel({
  heading, token, name, age, concern, summary, screening, empty,
}: {
  heading: string;
  token: string | undefined;
  name: string | undefined;
  age: number | undefined;
  concern: string | undefined;
  summary: string | undefined;
  screening: ScreeningSnapshot | undefined;
  empty: string;
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</p>
      {token ? (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xl font-bold">{token} · {name}</p>
            {screening ? <UrgencyBadge urgency={screening.urgency} /> : null}
          </div>
          <p className="text-sm text-muted-foreground">{age} yrs · {concern}</p>
          <div className="mt-3 rounded-xl bg-muted/50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold"><Sparkles className="size-3.5 text-primary" /> AI patient summary</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary ?? `Patient reports ${concern?.toLowerCase()}. Details collected at reception.`}
            </p>

            {screening && screening.reasons.length > 0 ? (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                <p className="flex items-center gap-1 text-xs font-semibold text-destructive">
                  <AlertTriangle className="size-3.5" /> Emergency signs reported
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-destructive">
                  {screening.reasons.map((r) => <li key={r}>• {r}</li>)}
                </ul>
                <p className="mt-1.5 text-[11px] text-destructive/80">
                  Escalate per hospital protocol — do not treat as routine.
                </p>
              </div>
            ) : null}

            {screening && screening.answers.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground">Screening responses</p>
                <dl className="mt-1.5 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                  {screening.answers.map((a) => (
                    <div key={a.label} className="flex justify-between gap-2 border-b border-border/40 py-0.5">
                      <dt className="text-muted-foreground">{a.label}</dt>
                      <dd className="text-right font-medium text-foreground">{a.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <p className="mt-2 text-[11px] text-muted-foreground">
              Generated from patient-provided information. Not a diagnosis.
            </p>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}