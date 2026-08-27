import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DashboardShell, StatCard, StatusPill } from "@/components/mediflow/Shell";
import { averageWait, calculateWaitTime, departmentLoad, getQueueStatus } from "@/lib/mediflow/queue";
import { queueImbalance } from "@/lib/mediflow/recommendation";
import { useMediflow } from "@/lib/mediflow/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Hospital Admin Analytics — Mediflow Operations Insight" },
      { name: "description", content: "Hospital-wide analytics: patient volume, department load, doctor utilisation, average waiting times and revenue for the day." },
      { property: "og:title", content: "Hospital Admin Analytics — Mediflow" },
      { property: "og:description", content: "Department load, doctor utilisation and waiting-time analytics." },
    ],
  }),
  component: AdminDashboard,
});

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function AdminDashboard() {
  const state = useMediflow((s) => s);
  const hospitalId = state.activeHospitalId;
  const doctors = state.doctors.filter((d) => d.hospitalId === hospitalId);
  const entries = state.entries.filter((e) => e.hospitalId === hospitalId);

  const load = useMemo(() => departmentLoad(state.entries, state.doctors, hospitalId), [state.entries, state.doctors, hospitalId]);
  const imbalances = useMemo(() => queueImbalance(state.entries, state.doctors, hospitalId), [state.entries, state.doctors, hospitalId]);

  const utilisation = doctors.map((d) => {
    const { waiting, completed } = getQueueStatus(state.entries, d.id);
    return { name: d.name.replace("Dr. ", ""), waiting: waiting.length, completed: completed.length,
      wait: calculateWaitTime(state.entries, d).minutes };
  });

  const revenue = state.bookings
    .filter((b) => b.hospitalId === hospitalId && b.paid)
    .reduce((sum, b) => sum + b.fee, 0);

  const hourly = useMemo(() => {
    const buckets = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"];
    return buckets.map((hour, i) => ({
      hour,
      patients: Math.max(0, Math.round(entries.length * (0.08 + 0.02 * Math.sin(i))) + (i % 3)),
    }));
  }, [entries.length]);

  const completedCount = entries.filter((e) => e.status === "completed").length;
  const noShowCount = entries.filter((e) => e.status === "no_show").length;

  return (
    <DashboardShell
      title="Hospital admin analytics"
      subtitle="Operational insight across departments — all figures derived from live demo queue state."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Patients today" value={entries.length} />
        <StatCard label="Consultations completed" value={completedCount} tone="success" />
        <StatCard label="Average wait" value={`${averageWait(state.entries, state.doctors, hospitalId)} min`} tone="warning" />
        <StatCard label="No-show rate" value={`${entries.length ? Math.round((noShowCount / entries.length) * 100) : 0}%`} tone="danger" />
        <StatCard label="Revenue (demo)" value={`₹${revenue.toLocaleString("en-IN")}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Patient flow through the day" note="Synthetic distribution derived from today's volume.">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="patients" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department load" note="Patients currently waiting per department.">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie isAnimationActive={false} data={load} dataKey="waiting" nameKey="department" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {load.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Doctor utilisation" note="Waiting vs completed consultations per doctor." className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilisation}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar isAnimationActive={false} dataKey="waiting" name="Waiting" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              <Bar isAnimationActive={false} dataKey="completed" name="Completed" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="surface-card p-5">
          <h2 className="text-base font-semibold">Doctor status board</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2">Doctor</th><th>Department</th><th>Status</th><th>Waiting</th><th>Est. wait</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => {
                  const { waiting } = getQueueStatus(state.entries, d.id);
                  return (
                    <tr key={d.id} className="border-b border-border/60">
                      <td className="py-2 font-medium">{d.name}</td>
                      <td className="text-muted-foreground">{d.department}</td>
                      <td className="py-2"><StatusPill status={d.status} /></td>
                      <td className="tabular-nums">{waiting.length}</td>
                      <td className="tabular-nums">{calculateWaitTime(state.entries, d).minutes} min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface-card h-fit p-5">
          <h2 className="text-base font-semibold">Load balancing insights</h2>
          {imbalances.length ? (
            <div className="mt-3 space-y-3">
              {imbalances.map((i) => (
                <div key={i.department} className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
                  <p className="text-sm font-semibold">{i.department}</p>
                  <p className="mt-1 text-muted-foreground">
                    {i.busiest} at {i.busiestWait} min vs {i.lightest} at {i.lightestWait} min. Reception can offer eligible
                    patients the lighter queue within the same care category.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Queues are balanced across departments right now.</p>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function ChartCard({ title, note, className, children }: { title: string; note: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`surface-card p-5 ${className ?? ""}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{note}</p>
      {children}
    </div>
  );
}