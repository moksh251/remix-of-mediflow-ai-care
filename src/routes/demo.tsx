import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, ClipboardList, Play, RotateCcw, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/mediflow/Shell";
import { resetDemo, tickSimulation, useMediflow } from "@/lib/mediflow/store";
import { toast } from "sonner";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Mediflow Demo Control Room — Judge Walkthrough" },
      { name: "description", content: "One-click walkthrough of Mediflow: patient journey, live queue, reception operations, doctor console and hospital analytics." },
      { property: "og:title", content: "Mediflow Demo Control Room" },
      { property: "og:description", content: "Switch between patient, reception, doctor and admin views in one demo hub." },
    ],
  }),
  component: DemoHub,
});

const ROLES = [
  { to: "/patient", icon: User, title: "Patient journey", body: "Symptom screening, care navigation, doctor recommendation, booking, payment and token." },
  { to: "/staff", icon: ClipboardList, title: "Reception operations", body: "Register walk-ins, generate tokens, manage arrivals, no-shows and priority alerts." },
  { to: "/doctor", icon: Stethoscope, title: "Doctor console", body: "Current and next patient, screening summary, start/complete consultation controls." },
  { to: "/admin", icon: BarChart3, title: "Admin analytics", body: "Department load, doctor utilisation, waiting times, no-show rate and revenue." },
] as const;

function DemoHub() {
  const state = useMediflow((s) => s);
  const waiting = state.entries.filter((e) => e.status === "waiting").length;

  return (
    <div className="min-h-screen soft-surface">
      <header className="border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
          <Logo />
          <Link to="/" className="ml-auto text-xs text-muted-foreground hover:text-foreground">Back to home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Demo control room</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every view below reads the same live queue state. Actions in one role instantly change what the others see —
          that is the whole point of Mediflow.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => { tickSimulation(); toast.success("Simulated hospital activity: consultations progressed."); }}>
            <Play className="size-4" /> Simulate hospital activity
          </Button>
          <Button variant="outline" onClick={() => { resetDemo(); toast.success("Demo reset to seeded state."); }}>
            <RotateCcw className="size-4" /> Reset demo data
          </Button>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
            <Activity className="size-3.5 text-primary" /> {waiting} patients waiting · {state.doctors.length} doctors
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Link key={r.to} to={r.to} className="surface-card group p-6 transition hover:shadow-lift">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <r.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold group-hover:text-primary">{r.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
            </Link>
          ))}
        </div>

        <div className="surface-card mt-8 p-6">
          <h2 className="text-base font-semibold">Suggested 3-minute walkthrough</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. Patient journey — screen symptoms, get the right department, book and receive a token.</li>
            <li>2. Live queue — watch patients ahead and the calculated waiting time update.</li>
            <li>3. Reception — see the same patient appear instantly and complete a consultation.</li>
            <li>4. Doctor console — start and finish a consultation; the queue recalculates everywhere.</li>
            <li>5. Admin analytics — show department load and load-balancing insights.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}