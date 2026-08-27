import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { HOSPITALS } from "@/lib/mediflow/data";
import { setActiveHospital, useMediflow } from "@/lib/mediflow/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          light ? "bg-navy-foreground/15 text-navy-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <Activity className="size-4" />
      </span>
      <span className={cn("text-lg font-extrabold tracking-tight", light && "text-navy-foreground")}>
        MEDIFLOW
      </span>
    </Link>
  );
}

export function HospitalPicker() {
  const active = useMediflow((s) => s.activeHospitalId);
  return (
    <Select value={active} onValueChange={setActiveHospital}>
      <SelectTrigger className="w-[220px] bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HOSPITALS.map((h) => (
          <SelectItem key={h.id} value={h.id} disabled={!h.open}>
            {h.name}
            {h.open ? "" : " (closed)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const NAV = [
  { to: "/patient", label: "Patient" },
  { to: "/staff", label: "Reception" },
  { to: "/doctor", label: "Doctor" },
  { to: "/admin", label: "Admin" },
] as const;

export function DashboardShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen soft-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-3 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <HospitalPicker />
            {actions}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        <p className="mt-10 flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Synthetic demonstration data. Mediflow supports care navigation and queue visibility only —
          it does not provide medical diagnosis and is not clinically validated.
        </p>
      </main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="surface-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    AVAILABLE: "bg-success/12 text-success border-success/30",
    "IN CONSULTATION": "bg-primary/10 text-primary border-primary/25",
    "ON BREAK": "bg-warning/15 text-warning-foreground border-warning/40",
    OFFLINE: "bg-muted text-muted-foreground border-border",
    "FULLY BOOKED": "bg-destructive/10 text-destructive border-destructive/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}