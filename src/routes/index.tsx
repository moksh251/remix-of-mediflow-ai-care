import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Clock,
  Hospital,
  LineChart,
  ShieldCheck,
  Stethoscope,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/mediflow/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mediflow — Right Care. Right Doctor. Less Waiting." },
      {
        name: "description",
        content:
          "Mediflow is AI-assisted hospital navigation with live doctor availability, smart care-category routing and calculated queue waiting times.",
      },
      { property: "og:title", content: "Mediflow — Right Care. Right Doctor. Less Waiting." },
      {
        property: "og:description",
        content: "AI-assisted hospital navigation, doctor availability and intelligent queue estimation.",
      },
    ],
  }),
  component: Landing,
});

const PROBLEMS = [
  { title: "Wrong department first", body: "Patients queue with the wrong specialist and repeat the whole journey." },
  { title: "Invisible waiting", body: "No one knows whether the wait is 10 minutes or two hours." },
  { title: "Unbalanced load", body: "One doctor is overloaded while a colleague in the same department is free." },
];

const STEPS = [
  { icon: Users, title: "Patient details", body: "Basic profile and hospital selection." },
  { icon: Stethoscope, title: "Symptom screening", body: "Symptom-specific questions, not one generic form." },
  { icon: BrainCircuit, title: "Care navigation", body: "A suggested care category — never a diagnosis." },
  { icon: Timer, title: "Doctor + queue", body: "Availability, patients ahead and calculated wait." },
  { icon: Activity, title: "Book & token", body: "Slot, demo payment, token and live queue tracking." },
];

const WHY = [
  { title: "Safety first", body: "Urgent screening responses bypass routine booking and surface an urgent-care notice." },
  { title: "Calculated, not guessed", body: "Waiting time = patients ahead × average consultation duration + live consultation state." },
  { title: "Suitability over speed", body: "Shortest queue never overrides the appropriate care category." },
  { title: "Hospital in control", body: "Staff acknowledge alerts and move patients — the system only advises." },
];

const FUTURE = [
  "ABDM integration", "EHR integration", "Hospital-to-hospital availability", "WhatsApp / SMS notifications",
  "Multilingual voice assistant", "Predictive hospital demand", "Wearable integration", "Ambulance coordination",
  "Insurance integration",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Logo />
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Link to="/staff" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Reception</Link>
            <Link to="/doctor" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Doctor</Link>
            <Link to="/admin" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Admin</Link>
          </nav>
          <Button asChild size="sm" className="ml-auto md:ml-0">
            <Link to="/patient">Find my doctor</Link>
          </Button>
        </div>
      </header>

      <section className="hero-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 bg-navy-foreground/10 px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="size-3.5" /> Care navigation, not diagnosis
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
              Right Care. Right Doctor.
              <br />
              Less Waiting.
            </h1>
            <p className="mt-5 max-w-xl text-base opacity-80 md:text-lg">
              AI-assisted hospital navigation, doctor availability and intelligent queue estimation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/patient">FIND MY DOCTOR <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
                <Link to="/patient">BOOK APPOINTMENT</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
                <Link to="/demo">ENTER DEMO</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-navy-foreground/15 bg-navy-foreground/8 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Live queue preview</p>
            <div className="mt-4 space-y-3">
              {[
                { name: "Dr. Suresh Patel", dept: "Gastroenterology", ahead: 3, wait: 18, status: "AVAILABLE" },
                { name: "Dr. Ashish Joshi", dept: "Gastroenterology", ahead: 8, wait: 53, status: "IN CONSULTATION" },
                { name: "Dr. Kavita Mehta", dept: "Pediatrics", ahead: 2, wait: 12, status: "AVAILABLE" },
              ].map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-xl bg-navy-foreground/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{d.name}</p>
                    <p className="text-xs opacity-70">{d.dept} · {d.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold tabular-nums">{d.wait}<span className="text-xs font-medium"> min</span></p>
                    <p className="text-[11px] opacity-70">{d.ahead} ahead</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] opacity-60">Synthetic demo data. Estimates are calculated, not guaranteed.</p>
          </div>
        </div>
      </section>

      <Section id="problem" title="The problem" kicker="Why hospitals feel slow">
        <div className="grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="surface-card surface-card-hover p-6">
              <h3 className="text-base font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="how" title="How it works" kicker="Patient journey" muted>
        <div className="grid gap-4 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="surface-card p-5">
              <s.icon className="size-5 text-primary" />
              <p className="mt-3 text-xs font-semibold text-muted-foreground">STEP {i + 1}</p>
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="queue" title="Smart queue" kicker="Calculated waiting time">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-6">
            <Clock className="size-5 text-primary" />
            <h3 className="mt-3 text-lg font-semibold">Deterministic estimation</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Patients ahead × average consultation duration, plus the remaining time of the consultation
              in progress and doctor-status overhead. Every number on screen comes from the queue engine.
            </p>
            <div className="mt-4 rounded-xl bg-muted p-4 font-mono text-xs text-muted-foreground">
              wait = ahead × avgDuration + remainingConsult + statusOverhead
            </div>
          </div>
          <div className="surface-card p-6">
            <LineChart className="size-5 text-primary" />
            <h3 className="mt-3 text-lg font-semibold">Smart queue balancing</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              When two doctors serve the same care category with very different loads, Mediflow flags the
              imbalance to staff. Hospital workflow stays in human control.
            </p>
          </div>
        </div>
      </Section>

      <Section id="ai" title="AI-assisted navigation" kicker="Screening, safely" muted>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-card p-6">
            <h3 className="text-base font-semibold">Symptom-specific questions</h3>
            <p className="mt-2 text-sm text-muted-foreground">Stomach pain, headache, fever, pregnancy and pediatric flows each ask their own screening set.</p>
          </div>
          <div className="surface-card p-6">
            <h3 className="text-base font-semibold">Care category, not diagnosis</h3>
            <p className="mt-2 text-sm text-muted-foreground">Mediflow suggests a department such as Gastroenterology. It never names a condition.</p>
          </div>
          <div className="surface-card border-destructive/30 p-6">
            <h3 className="text-base font-semibold text-destructive">Urgent safety path</h3>
            <p className="mt-2 text-sm text-muted-foreground">Concerning responses skip routine booking and show an urgent medical attention notice.</p>
          </div>
        </div>
      </Section>

      <Section id="hospital" title="Hospital dashboards" kicker="Reception, doctor, admin">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: "/staff", icon: Hospital, title: "Reception", body: "Register patients, generate tokens, manage arrivals and no-shows." },
            { to: "/doctor", icon: Stethoscope, title: "Doctor", body: "Current patient, next patient, queue control and patient summary." },
            { to: "/admin", icon: LineChart, title: "Admin", body: "Patient flow, waiting trends, workload and department queues." },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="surface-card surface-card-hover block p-6">
              <c.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-base font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Open <ArrowRight className="size-3.5" /></span>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="why" title="Why Mediflow" kicker="Design principles" muted>
        <div className="grid gap-4 md:grid-cols-2">
          {WHY.map((w) => (
            <div key={w.title} className="surface-card p-6">
              <h3 className="text-base font-semibold">{w.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="future" title="Future scope" kicker="Not built yet">
        <div className="flex flex-wrap gap-2">
          {FUTURE.map((f) => (
            <span key={f} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">{f}</span>
          ))}
        </div>
      </Section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Logo />
          <p className="mt-4 max-w-3xl text-xs text-muted-foreground">
            Mediflow is a hackathon prototype using synthetic demonstration data. It does not provide medical
            diagnosis or treatment advice, is not clinically validated, and payments shown are demo-only with no
            real payment processing. In an emergency, contact your local emergency services.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({
  id, title, kicker, children, muted,
}: {
  id: string; title: string; kicker: string; children: React.ReactNode; muted?: boolean;
}) {
  return (
    <section id={id} className={muted ? "soft-surface" : "bg-background"}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{kicker}</p>
        <h2 className="mt-2 mb-7 text-2xl font-bold md:text-3xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}
