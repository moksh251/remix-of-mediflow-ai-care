import type { Doctor, QueueEntry } from "./types";

export function getQueueStatus(entries: QueueEntry[], doctorId: string) {
  const mine = entries.filter((e) => e.doctorId === doctorId);
  const waiting = mine
    .filter((e) => e.status === "waiting")
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.createdAtMin - b.createdAtMin);
  const current = mine.find((e) => e.status === "in_consultation") ?? null;
  const completed = mine.filter((e) => e.status === "completed");
  const noShows = mine.filter((e) => e.status === "no_show");
  return { waiting, current, completed, noShows, all: mine };
}

function currentConsultRemaining(doctor: Doctor, hasCurrent: boolean) {
  if (!hasCurrent) return 0;
  const elapsed = doctor.consultStartedMinutesAgo ?? 0;
  return Math.max(1, doctor.avgDuration - elapsed);
}

/**
 * Deterministic wait estimation:
 * patients ahead x average consultation duration + remaining time of the
 * consultation in progress + doctor-status overhead.
 */
export function calculateWaitTime(
  entries: QueueEntry[],
  doctor: Doctor,
  entryId?: string,
): { minutes: number; ahead: number } {
  const { waiting, current } = getQueueStatus(entries, doctor.id);
  const index = entryId ? waiting.findIndex((e) => e.id === entryId) : -1;
  const ahead = index >= 0 ? index : waiting.length;
  let minutes = ahead * doctor.avgDuration + currentConsultRemaining(doctor, Boolean(current));
  if (doctor.status === "ON BREAK") minutes += 15;
  if (doctor.status === "OFFLINE") minutes += 60;
  return { minutes: Math.round(minutes), ahead };
}

export function recalculateQueue(entries: QueueEntry[], doctors: Doctor[]) {
  return entries.map((entry) => {
    const doctor = doctors.find((d) => d.id === entry.doctorId);
    if (!doctor || entry.status !== "waiting") return { ...entry, eta: 0 };
    return { ...entry, eta: calculateWaitTime(entries, doctor, entry.id).minutes };
  });
}

export function departmentLoad(entries: QueueEntry[], doctors: Doctor[], hospitalId: string) {
  const map = new Map<string, number>();
  for (const doc of doctors.filter((d) => d.hospitalId === hospitalId)) {
    const { waiting } = getQueueStatus(entries, doc.id);
    map.set(doc.department, (map.get(doc.department) ?? 0) + waiting.length);
  }
  return [...map.entries()].map(([department, waiting]) => ({ department, waiting }));
}

export function averageWait(entries: QueueEntry[], doctors: Doctor[], hospitalId: string) {
  const docs = doctors.filter((d) => d.hospitalId === hospitalId);
  if (!docs.length) return 0;
  const total = docs.reduce((sum, d) => sum + calculateWaitTime(entries, d).minutes, 0);
  return Math.round(total / docs.length);
}