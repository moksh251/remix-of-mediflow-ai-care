import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, ClipboardList, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell, StatCard, StatusPill } from "@/components/mediflow/Shell";
import { calculateWaitTime, averageWait, getQueueStatus } from "@/lib/mediflow/queue";
import { queueImbalance } from "@/lib/mediflow/recommendation";
import {
  acknowledgeAlert, addPatientToQueue, completePatient, markNoShow, startConsultation, useMediflow,
} from "@/lib/mediflow/store";
import { toast } from "sonner";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Reception Live Operations — Mediflow Hospital Staff" },
      { name: "description", content: "Register patients, generate tokens, manage arrivals, no-shows and live department queues from one operations dashboard." },
      { property: "og:title", content: "Reception Live Operations — Mediflow" },
      { property: "og:description", content: "Token generation, queue management and live hospital operations." },
    ],
  }),
  component: StaffDashboard,
});

function StaffDashboard() {
  const state = useMediflow((s) => s);
  const hospitalId = state.activeHospitalId;
  const doctors = state.doctors.filter((d) => d.hospitalId === hospitalId);
  const entries = state.entries.filter((e) => e.hospitalId === hospitalId);

  const [form, setForm] = useState({ name: "", age: "", concern: "Fever", doctorId: "" });
  const imbalances = useMemo(() => queueImbalance(state.entries, state.doctors, hospitalId), [state.entries, state.doctors, hospitalId]);

  const waitingCount = entries.filter((e) => e.status === "waiting").length;
  const activeDoctors = doctors.filter((d) => d.status === "AVAILABLE" || d.status === "IN CONSULTATION").length;

  function register(): void {
    const age = Number(form.age);
    if (form.name.trim().length < 2) {
      toast.error("Enter the patient's name.");
      return;
    }
    if (!form.age || Number.isNaN(age) || age < 0 || age > 120) {
      toast.error("Enter a valid age.");
      return;
    }
    if (!form.doctorId) {
      toast.error("Select a doctor.");
      return;
    }
    const entry = addPatientToQueue({
      hospitalId, doctorId: form.doctorId, patientName: form.name.trim(), age,
      concern: form.concern, source: "reception",
    });
    toast.success(`Token ${entry.token} generated. Queue and estimated wait updated automatically.`);
    setForm({ name: "", age: "", concern: "Fever", doctorId: "" });
  }

  return (
    <DashboardShell
      title="Hospital staff — live operations"
      subtitle="Register patients, generate tokens and keep the queue moving. Waiting times are calculated by the system."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Today's patients" value={entries.length} />
        <StatCard label="Waiting patients" value={waitingCount} tone="warning" />
        <StatCard label="Active doctors" value={`${activeDoctors}/${doctors.length}`} tone="success" />
        <StatCard label="Average wait" value={`${averageWait(state.entries, state.doctors, hospitalId)} min`} />
        <StatCard label="Appointments" value={state.bookings.filter((b) => b.hospitalId === hospitalId).length} />
        <StatCard label="Priority alerts" value={state.alerts.filter((a) => !a.acknowledged && a.level === "priority").length} tone="danger" />
      </div>

      {state.alerts.filter((a) => !a.acknowledged).length > 0 && (
        <div className="mt-6 space-y-3">
          {state.alerts.filter((a) => !a.acknowledged).map((a) => (
            <div key={a.id} className={`surface-card border-l-4 p-4 ${a.level === "priority" ? "border-l-destructive" : "border-l-primary"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <BellRing className="size-4" /> {a.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">ETA {a.etaMinutes} minutes · staff decision required</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => { acknowledgeAlert(a.id); toast.success("Alert acknowledged."); }}>Acknowledge</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Room and resources marked as being prepared.")}>Prepare</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.success("Contact patient action logged (demo).")}>Contact patient</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="surface-card h-fit p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold"><UserPlus className="size-4 text-primary" /> Register patient</h2>
          <p className="mt-1 text-xs text-muted-foreground">The system generates the token, updates the queue and calculates the estimated wait.</p>
          <div className="mt-4 space-y-3">
            <div><Label className="text-sm">Patient name</Label>
              <Input className="mt-1.5" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
            <div><Label className="text-sm">Age</Label>
              <Input className="mt-1.5" inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="34" /></div>
            <div><Label className="text-sm">Concern</Label>
              <Select value={form.concern} onValueChange={(v) => setForm({ ...form, concern: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Fever", "Stomach Pain", "Headache", "Cough / Cold", "Pregnancy-related", "Child Health", "General Check-up"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select></div>
            <div><Label className="text-sm">Doctor</Label>
              <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} — {d.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select></div>
            <Button className="w-full" onClick={register}>Register & generate token</Button>
          </div>

          {imbalances.length > 0 && (
            <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide">Smart queue balance</p>
              {imbalances.map((i) => (
                <div key={i.department} className="mt-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{i.department}: queue imbalance detected.</p>
                  <p>{i.busiest} — {i.busiestWait} min · {i.lightest} — {i.lightestWait} min</p>
                  <p className="mt-1">Both doctors are configured for the same care category. Eligible patients may be considered for {i.lightest} according to hospital workflow.</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="surface-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><ClipboardList className="size-4 text-primary" /> Doctor queues</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {doctors.map((d) => {
                const { waiting, current } = getQueueStatus(state.entries, d.id);
                const { minutes } = calculateWaitTime(state.entries, d);
                return (
                  <div key={d.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.department}</p>
                      </div>
                      <StatusPill status={d.status} />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Serving <b className="text-foreground">{current?.token ?? "—"}</b></span>
                      <span>Waiting <b className="text-foreground">{waiting.length}</b></span>
                      <span>Est. <b className="text-foreground">{minutes} min</b></span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => { startConsultation(d.id); toast.success("Consultation started."); }}>Start</Button>
                      <Button size="sm" variant="outline" onClick={() => { completePatient(d.id); toast.success("Consultation completed. Queue recalculated."); }}>
                        <CheckCircle2 className="size-3.5" /> Complete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-base font-semibold">Waiting list</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2">Token</th><th>Patient</th><th>Concern</th><th>Doctor</th><th>Est. wait</th><th>Source</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.filter((e) => e.status === "waiting").slice(0, 14).map((e) => {
                    const doc = doctors.find((d) => d.id === e.doctorId)!;
                    const { minutes } = calculateWaitTime(state.entries, doc, e.id);
                    return (
                      <tr key={e.id} className="border-b border-border/60">
                        <td className="py-2 font-semibold tabular-nums">{e.token}{e.priority ? <span className="ml-1 text-[10px] text-destructive">PRIORITY</span> : null}</td>
                        <td>{e.patientName}<span className="text-xs text-muted-foreground"> · {e.age}</span></td>
                        <td className="text-muted-foreground">{e.concern}</td>
                        <td className="text-muted-foreground">{doc.name}</td>
                        <td className="tabular-nums">{minutes} min</td>
                        <td className="text-xs text-muted-foreground">{e.source === "patient-app" ? "Mediflow app" : "Reception"}</td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => toast.success(`${e.token} marked arrived.`)}>Arrived</Button>
                            <Button size="sm" variant="ghost" onClick={() => { markNoShow(e.id); toast.success(`${e.token} marked as no-show.`); }}>
                              <XCircle className="size-3.5" /> No-show
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {entries.filter((e) => e.status === "waiting").length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No patients waiting. Register a patient to generate the first token.</p>
              )}
            </div>
            <Link to="/admin" className="mt-4 inline-block text-sm font-medium text-primary">Open admin analytics →</Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}