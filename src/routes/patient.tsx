import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Check, CreditCard, Info, Phone, Sparkles, Star, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo, StatusPill } from "@/components/mediflow/Shell";
import { HOSPITALS } from "@/lib/mediflow/data";
import { SYMPTOMS, buildPatientSummary, evaluateScreening } from "@/lib/mediflow/screening";
import { recommendDoctors, sortOptions, type DoctorOption } from "@/lib/mediflow/recommendation";
import { addAlert, addBooking, addPatientToQueue, payBooking, setActiveHospital, useMediflow } from "@/lib/mediflow/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PatientDetails } from "@/lib/mediflow/types";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Find My Doctor — Mediflow Patient Navigation" },
      { name: "description", content: "Answer symptom-specific screening questions and get a suggested care category, available doctors and calculated waiting times." },
      { property: "og:title", content: "Find My Doctor — Mediflow Patient Navigation" },
      { property: "og:description", content: "Symptom screening, care navigation, doctor availability and live queue booking." },
    ],
  }),
  component: PatientFlow,
});

type Step = "details" | "concern" | "screening" | "navigation" | "doctors" | "booking" | "payment" | "done";
const ORDER: Step[] = ["details", "concern", "screening", "navigation", "doctors", "booking", "payment", "done"];

function PatientFlow() {
  const navigate = useNavigate();
  const state = useMediflow((s) => s);
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<PatientDetails>({
    name: "", age: "", sex: "", height: "", weight: "", phone: "", hospitalId: "h1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qIndex, setQIndex] = useState(0);
  const [sortMode, setSortMode] = useState<"recommended" | "wait" | "slot">("recommended");
  const [chosen, setChosen] = useState<DoctorOption | null>(null);
  const [slot, setSlot] = useState("");
  const [method, setMethod] = useState("UPI");
  const [result, setResult] = useState<{ bookingId: string; token: string; txn: string } | null>(null);

  const hospital = HOSPITALS.find((h) => h.id === details.hospitalId)!;
  const questions = useMemo(
    () => SYMPTOMS.filter((s) => selected.includes(s.id)).flatMap((s) => s.questions.map((q) => ({ ...q, symptomId: s.id, symptomLabel: s.label }))),
    [selected],
  );
  const screening = useMemo(() => evaluateScreening(selected, answers, freeText), [selected, answers, freeText]);
  const options = useMemo(
    () => recommendDoctors(state.entries, state.doctors, { hospitalId: details.hospitalId, department: screening.department }),
    [state.entries, state.doctors, details.hospitalId, screening.department],
  );
  const sorted = useMemo(() => sortOptions(options, sortMode), [options, sortMode]);
  const summary = useMemo(() => buildPatientSummary(selected, answers, screening.department), [selected, answers, screening.department]);

  const progress = ((ORDER.indexOf(step) + 1) / ORDER.length) * 100;

  function validateDetails() {
    const e: Record<string, string> = {};
    if (details.name.trim().length < 2) e['name'] = "Please enter the patient's full name.";
    if (details.name.trim().length > 60) e['name'] = "Name is too long.";
    const age = Number(details.age);
    if (!details.age || Number.isNaN(age) || age < 0 || age > 120) e['age'] = "Enter a valid age between 0 and 120.";
    if (!details.sex) e['sex'] = "Please select an option.";
    if (details.phone && !/^[0-9]{10}$/.test(details.phone)) e['phone'] = "Phone must be 10 digits.";
    if (!hospital.open) e['hospitalId'] = "This hospital is currently closed. Please choose another hospital.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function confirmBooking() {
    if (!chosen || !slot) {
      toast.error("Please select an appointment slot.");
      return;
    }
    setStep("payment");
  }

  function pay() {
    if (!chosen) return;
    const priority = selected.includes("pregnancy") || screening.urgent;
    const entry = addPatientToQueue({
      hospitalId: details.hospitalId,
      doctorId: chosen.doctor.id,
      patientName: details.name.trim(),
      age: Number(details.age),
      concern: SYMPTOMS.filter((s) => selected.includes(s.id)).map((s) => s.label).join(", "),
      priority,
      summary,
      source: "patient-app",
    });
    const bookingId = `MF-2026-${1000 + state.bookings.length + 48}`;
    addBooking({
      id: entry.id, bookingId, token: entry.token, entryId: entry.id, doctorId: chosen.doctor.id,
      hospitalId: details.hospitalId, patientName: details.name.trim(), slot, fee: chosen.doctor.fee, paid: false,
    });
    const txn = payBooking(bookingId, method);
    if (priority) {
      addAlert({
        title: "PATIENT ARRIVING — priority review required",
        detail: `${details.name.trim()} (${details.age}) · ${selected.includes("pregnancy") ? "Pregnancy-related appointment" : "Screening flagged for early review"} · ${chosen.doctor.name}. Token ${entry.token}.`,
        etaMinutes: 12,
        level: "priority",
      });
    }
    setResult({ bookingId, token: entry.token, txn });
    setStep("done");
  }

  return (
    <div className="min-h-screen soft-surface pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Logo />
          <span className="ml-auto text-xs text-muted-foreground">{hospital.name}</span>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {step === "details" && (
          <Card title="Patient details" subtitle="Step 1 of 5 · basic information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors['name']} className="sm:col-span-2">
                <Input value={details.name} maxLength={60} onChange={(e) => setDetails({ ...details, name: e.target.value })} placeholder="e.g. Priya Shah" />
              </Field>
              <Field label="Age" error={errors['age']}>
                <Input inputMode="numeric" value={details.age} onChange={(e) => setDetails({ ...details, age: e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")) })} placeholder="27" />
              </Field>
              <Field label="Sex" error={errors['sex']}>
                <Select value={details.sex} onValueChange={(v) => setDetails({ ...details, sex: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Female", "Male", "Other", "Prefer not to say"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Height (cm)"><Input inputMode="numeric" value={details.height} onChange={(e) => setDetails({ ...details, height: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="162" /></Field>
              <Field label="Weight (kg)"><Input inputMode="numeric" value={details.weight} onChange={(e) => setDetails({ ...details, weight: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="54" /></Field>
              <Field label="Phone (optional)" error={errors['phone']} className="sm:col-span-2">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" inputMode="numeric" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit number" />
                </div>
              </Field>
              <Field label="Hospital" error={errors['hospitalId']} className="sm:col-span-2">
                <Select value={details.hospitalId} onValueChange={(v) => { setDetails({ ...details, hospitalId: v }); setActiveHospital(v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOSPITALS.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} — {h.city}{h.open ? "" : " (closed)"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Actions
              onBack={() => navigate({ to: "/" })}
              backLabel="Home"
              onNext={() => { if (validateDetails()) setStep("concern"); }}
              nextLabel="Continue"
            />
            <Disclaimer />
          </Card>
        )}

        {step === "concern" && (
          <Card title="What brings you to the hospital today?" subtitle="Step 2 of 5 · select one or more">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SYMPTOMS.map((s) => {
                const active = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(active ? selected.filter((x) => x !== s.id) : [...selected, s.id])}
                    className={cn(
                      "rounded-xl border p-4 text-left text-sm font-medium transition",
                      active ? "border-primary bg-primary/8 text-primary shadow-card" : "border-border bg-card text-foreground hover:border-primary/40",
                    )}
                  >
                    {s.label}
                    {active ? <Check className="mt-2 size-4" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <Label className="text-sm">Describe it in your own words (optional)</Label>
              <Textarea className="mt-2" maxLength={400} value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="e.g. Burning pain in the upper stomach after meals" />
            </div>
            <Actions
              onBack={() => setStep("details")}
              onNext={() => {
                if (!selected.length) { toast.error("Please select at least one concern."); return; }
                setQIndex(0); setStep("screening");
              }}
              nextLabel="Start screening"
            />
          </Card>
        )}

        {step === "screening" && questions[qIndex] && (
          <Card
            title="Basic screening"
            subtitle={`Step 3 of 5 · ${questions[qIndex]!.symptomLabel} · question ${qIndex + 1} of ${questions.length}`}
          >
            <p className="text-lg font-semibold">{questions[qIndex]!.text}</p>
            <div className="mt-4 grid gap-2">
              {questions[qIndex]!.options.map((opt) => {
                const key = `${questions[qIndex]!.symptomId}:${questions[qIndex]!.id}`;
                const active = answers[key] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      setAnswers({ ...answers, [key]: opt });
                      if (qIndex + 1 < questions.length) setQIndex(qIndex + 1);
                      else setStep("navigation");
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                      active ? "border-primary bg-primary/8 text-primary" : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    {opt}
                    <ArrowRight className="size-4 opacity-40" />
                  </button>
                );
              })}
            </div>
            <Actions
              onBack={() => (qIndex > 0 ? setQIndex(qIndex - 1) : setStep("concern"))}
              onNext={() => (qIndex + 1 < questions.length ? setQIndex(qIndex + 1) : setStep("navigation"))}
              nextLabel={qIndex + 1 < questions.length ? "Skip" : "See result"}
              nextVariant="outline"
            />
            <Disclaimer />
          </Card>
        )}

        {step === "navigation" && (
          <div className="space-y-4">
            {screening.urgent ? (
              <div className="rounded-2xl border-2 border-destructive bg-destructive/5 p-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="size-5" />
                  <h2 className="text-lg font-extrabold tracking-wide">URGENT MEDICAL ATTENTION</h2>
                </div>
                <p className="mt-3 text-sm">
                  Your responses may indicate a potentially urgent situation. Please seek immediate medical
                  attention or contact the hospital emergency department according to hospital protocol.
                </p>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {screening.reasons.map((r) => <li key={r}>• {r}</li>)}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="destructive" onClick={() => toast.success("Emergency department notified in this demo. Staff alert created.")}>
                    Notify emergency department (demo)
                  </Button>
                  <Button variant="outline" onClick={() => setStep("doctors")}>Continue to routine options anyway</Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Mediflow does not provide a medical diagnosis. This is a screening prompt only.
                </p>
              </div>
            ) : null}

            <Card title="Care navigation" subtitle="Step 4 of 5 · suggested care category">
              <div className="rounded-xl border border-primary/25 bg-primary/6 p-5">
                <p className="text-sm text-muted-foreground">Based on the information provided,</p>
                <p className="mt-1 text-2xl font-bold text-primary">{screening.department}</p>
                <p className="mt-1 text-sm text-muted-foreground">may be an appropriate care category.</p>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="text-sm font-semibold">AI patient summary</p>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <Row label="Patient" value={details.name} />
                  <Row label="Age" value={String(details.age)} />
                  <Row label="Primary concern" value={SYMPTOMS.find((s) => s.id === selected[0])?.label ?? "-"} />
                  <Row label="Navigation" value={screening.department} />
                </dl>
                <p className="mt-3 text-sm text-muted-foreground">{summary}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  This summary is generated from patient-provided information and is not a diagnosis.
                </p>
              </div>
              <Actions onBack={() => setStep("screening")} onNext={() => setStep("doctors")} nextLabel="See available doctors" />
            </Card>
          </div>
        )}

        {step === "doctors" && (
          <Card title="Available doctors" subtitle={`Step 5 of 5 · ${screening.department} · ${hospital.name}`}>
            {sorted.length === 0 ? (
              <EmptyState
                title="No doctor available in this care category"
                body={`${hospital.name} has no ${screening.department} doctor configured right now.`}
                actionLabel="Choose another hospital"
                onAction={() => setStep("details")}
              />
            ) : (
              <>
                {sorted[0] && (
                  <div className="rounded-2xl border-2 border-primary bg-primary/5 p-5">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                      <Star className="size-3.5 fill-current" /> Mediflow recommendation
                    </p>
                    <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-bold">{sorted[0].doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{sorted[0].doctor.specialization} · {sorted[0].doctor.experience} yrs</p>
                        <div className="mt-2"><StatusPill status={sorted[0].doctor.status} /></div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold tabular-nums text-primary">{sorted[0].wait}<span className="text-sm"> min</span></p>
                        <p className="text-xs text-muted-foreground">{sorted[0].ahead} patients ahead</p>
                        <p className="text-xs text-muted-foreground">Fee ₹{sorted[0].doctor.fee}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why?</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {sorted[0].reasons.map((r) => (
                        <li key={r} className="flex items-start gap-2"><Check className="mt-0.5 size-4 text-success" />{r}</li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button onClick={() => { setChosen(sorted[0]!); setSlot(sorted[0]!.doctor.slots[0] ?? ""); setStep("booking"); }} disabled={!sorted[0].bookable}>
                        Book with {sorted[0].doctor.name.replace("Dr. ", "Dr. ").split(" ").slice(0, 2).join(" ")}
                      </Button>
                      <Button variant="outline" onClick={() => { setChosen(sorted[0]!); setSlot("Walk-in queue"); setStep("booking"); }}>Join queue</Button>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort</span>
                  {([["recommended", "Recommended"], ["wait", "Shortest wait"], ["slot", "Earliest appointment"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setSortMode(k)}
                      className={cn("rounded-full border px-3 py-1 text-xs font-medium transition", sortMode === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
                      {l}
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid gap-3">
                  {sorted.map((o) => (
                    <div key={o.doctor.id} className="surface-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{o.doctor.name}</p>
                          <p className="text-xs text-muted-foreground">{o.doctor.specialization} · {o.doctor.experience} yrs experience</p>
                          <div className="mt-2"><StatusPill status={o.doctor.status} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right text-xs text-muted-foreground sm:grid-cols-4">
                          <Metric label="Ahead" value={String(o.ahead)} />
                          <Metric label="Est. wait" value={`${o.wait} min`} />
                          <Metric label="Fee" value={`₹${o.doctor.fee}`} />
                          <Metric label="Next slot" value={o.nextSlot} />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button size="sm" variant="outline" disabled={!o.bookable}
                          onClick={() => { setChosen(o); setSlot(o.doctor.slots[0] ?? ""); setStep("booking"); }}>
                          {o.bookable ? "Select" : "Unavailable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Actions onBack={() => setStep("navigation")} hideNext />
          </Card>
        )}

        {step === "booking" && chosen && (
          <Card title="Confirm appointment" subtitle={`${chosen.doctor.name} · ${chosen.doctor.specialization}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Patients ahead" value={String(chosen.ahead)} />
              <InfoTile label="Estimated wait" value={`${chosen.wait} min`} />
              <InfoTile label="Consultation fee" value={`₹${chosen.doctor.fee}`} />
              <InfoTile label="Avg consultation" value={`${chosen.doctor.avgDuration} min`} />
            </div>
            <p className="mt-5 text-sm font-semibold">Select a slot</p>
            {chosen.doctor.slots.length === 0 ? (
              <EmptyState title="No slots left today" body="You can still join the walk-in queue for this doctor." actionLabel="Join walk-in queue" onAction={() => { setSlot("Walk-in queue"); setStep("payment"); }} />
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {["Walk-in queue", ...chosen.doctor.slots].map((s) => (
                  <button key={s} onClick={() => setSlot(s)}
                    className={cn("rounded-lg border px-3 py-2 text-sm transition", slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40")}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <Actions onBack={() => setStep("doctors")} onNext={confirmBooking} nextLabel="Continue to payment" />
          </Card>
        )}

        {step === "payment" && chosen && (
          <Card title="Demo payment" subtitle="No real payment is processed">
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs font-semibold text-warning-foreground">
              DEMO PAYMENT · simulated transaction for demonstration only
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm text-muted-foreground">Consultation fee</p>
                <p className="text-xs text-muted-foreground">{chosen.doctor.name} · {slot}</p>
              </div>
              <p className="text-2xl font-bold">₹{chosen.doctor.fee}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[{ id: "UPI", icon: BadgeCheck }, { id: "Demo Card", icon: CreditCard }, { id: "Demo Wallet", icon: Wallet }].map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={cn("flex items-center gap-2 rounded-xl border p-4 text-sm font-medium transition", method === m.id ? "border-primary bg-primary/8 text-primary" : "border-border bg-card hover:border-primary/40")}>
                  <m.icon className="size-4" /> {m.id}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button size="lg" onClick={pay}>PAY & CONFIRM</Button>
              <Button size="lg" variant="outline" onClick={() => toast.error("Demo payment failed. No amount was charged — please retry or choose another method.")}>
                Simulate payment failure
              </Button>
            </div>
            <Actions onBack={() => setStep("booking")} hideNext />
          </Card>
        )}

        {step === "done" && chosen && result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-success/40 bg-success/8 p-4 text-sm font-semibold text-success">
              PAYMENT SUCCESSFUL ✓ · Transaction {result.txn} (demo)
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
              <div className="hero-surface px-6 py-5">
                <p className="text-xs uppercase tracking-widest opacity-70">Booking confirmed</p>
                <p className="mt-1 text-3xl font-extrabold">{result.token}</p>
                <p className="text-xs opacity-70">Booking ID {result.bookingId}</p>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto]">
                <dl className="grid gap-2 text-sm">
                  <Row label="Patient" value={details.name} />
                  <Row label="Doctor" value={chosen.doctor.name} />
                  <Row label="Specialization" value={chosen.doctor.specialization} />
                  <Row label="Appointment" value={slot} />
                  <Row label="Estimated wait" value={`${chosen.wait} minutes`} />
                  <Row label="Hospital" value={hospital.name} />
                </dl>
                <QrBlock value={result.token} />
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border p-4">
                <Button asChild><Link to="/queue/$token" params={{ token: result.token }}>Track live queue</Link></Button>
                <Button asChild variant="outline"><Link to="/staff">Reception view</Link></Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Demo booking with synthetic data. Estimated waiting time is calculated from current queue state and may change.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mb-5 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string | undefined; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Actions({
  onBack, onNext, nextLabel = "Continue", backLabel = "Back", hideNext, nextVariant = "default",
}: {
  onBack: () => void; onNext?: () => void; nextLabel?: string; backLabel?: string; hideNext?: boolean;
  nextVariant?: "default" | "outline";
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="size-4" /> {backLabel}</Button>
      {!hideNext && onNext ? (
        <Button variant={nextVariant} onClick={onNext}>{nextLabel} <ArrowRight className="size-4" /></Button>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <Info className="mx-auto size-5 text-muted-foreground" />
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button className="mt-4" variant="outline" onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      Mediflow provides care navigation and queue information only. It does not provide a medical
      diagnosis. In an emergency, contact emergency services immediately.
    </p>
  );
}

export function QrBlock({ value }: { value: string }) {
  const cells = Array.from({ length: 64 }, (_, i) => {
    const code = value.charCodeAt(i % value.length) + i * 7;
    return code % 3 !== 0;
  });
  return (
    <div className="mx-auto w-fit rounded-xl border border-border bg-card p-3">
      <div className="grid grid-cols-8 gap-0.5">
        {cells.map((on, i) => (
          <span key={i} className={cn("size-3 rounded-[2px]", on ? "bg-navy" : "bg-muted")} />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold tracking-widest text-muted-foreground">{value}</p>
    </div>
  );
}