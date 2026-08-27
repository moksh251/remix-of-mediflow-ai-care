import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, StatusPill } from "@/components/mediflow/Shell";
import { HOSPITALS } from "@/lib/mediflow/data";
import { calculateWaitTime, getQueueStatus } from "@/lib/mediflow/queue";
import { completePatient, useMediflow } from "@/lib/mediflow/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/queue/$token")({
  head: () => ({
    meta: [
      { title: "Live Queue Tracking — Mediflow Token Status" },
      { name: "description", content: "Track your Mediflow token in real time: patients ahead, currently serving token and calculated estimated waiting time." },
      { property: "og:title", content: "Live Queue Tracking — Mediflow" },
      { property: "og:description", content: "Live token status, patients ahead and estimated waiting time." },
    ],
  }),
  component: LiveQueue,
});

function LiveQueue() {
  const { token } = Route.useParams();
  const state = useMediflow((s) => s);
  const [updatedAgo, setUpdatedAgo] = useState(0);

  const entry = state.entries.find((e) => e.token === token);
  const doctor = state.doctors.find((d) => d.id === entry?.doctorId);

  useEffect(() => {
    const id = setInterval(() => setUpdatedAgo((v) => v + 1), 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    setUpdatedAgo(0);
  }, [state.lastUpdatedTick]);

  if (!entry || !doctor) {
    return (
      <Wrapper>
        <div className="surface-card p-8 text-center">
          <h1 className="text-lg font-bold">Queue information unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Token {token} isn't in the current session queue. Demo state resets on page reload.
          </p>
          <Button asChild className="mt-4"><Link to="/patient">Start a new booking</Link></Button>
        </div>
      </Wrapper>
    );
  }

  const { waiting, current } = getQueueStatus(state.entries, doctor.id);
  const { minutes, ahead } = calculateWaitTime(state.entries, doctor, entry.id);
  const strip = [...(current ? [current] : []), ...waiting].slice(0, 8);
  const done = entry.status === "completed";

  return (
    <Wrapper>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
        <div className="hero-surface px-6 py-6 text-center">
          <p className="text-xs uppercase tracking-widest opacity-70">Your token</p>
          <p className="text-5xl font-extrabold">{entry.token}</p>
          {entry.priority ? (
            <span className="mt-2 inline-block rounded-full bg-navy-foreground/15 px-3 py-1 text-[11px] font-semibold">
              PRIORITY REVIEW FLAGGED
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
          <Cell label="Currently serving" value={current ? current.token : "—"} />
          <Cell label="Patients ahead" value={done ? "0" : String(ahead)} />
          <Cell label="Estimated waiting" value={done ? "Done" : `${minutes} min`} />
        </div>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{doctor.name}</p>
              <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
            </div>
            <StatusPill status={doctor.status} />
          </div>

          <div className="space-y-1.5">
            {strip.map((e) => {
              const you = e.id === entry.id;
              const serving = e.status === "in_consultation";
              const next = !serving && waiting[0]?.id === e.id;
              return (
                <div key={e.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                    you ? "border-primary bg-primary/8 font-semibold text-primary" : "border-border bg-card",
                  )}>
                  <span className="tabular-nums">{e.token}</span>
                  <span className="text-xs">
                    {serving ? "IN CONSULTATION" : you ? "YOU" : next ? "NEXT" : "waiting"}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="size-3" /> Queue updated {updatedAgo === 0 ? "just now" : `${updatedAgo} minute${updatedAgo > 1 ? "s" : ""} ago`}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={() => completePatient(doctor.id)}>
              <Play className="size-4" /> Simulate one consultation completing
            </Button>
            <Button asChild variant="ghost"><Link to="/staff">Reception dashboard</Link></Button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Hospital: {HOSPITALS.find((h) => h.id === entry.hospitalId)?.name}. Estimated waiting time is calculated
        from current queue state using synthetic demo data and is not a guarantee.
      </p>
    </Wrapper>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen soft-surface pb-24">
      <header className="border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Logo />
          <Link to="/patient" className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Patient flow
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}