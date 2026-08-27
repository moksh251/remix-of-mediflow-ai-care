import { calculateWaitTime, getQueueStatus } from "./queue";
import type { Doctor, QueueEntry } from "./types";

export interface DoctorOption {
  doctor: Doctor;
  ahead: number;
  wait: number;
  nextSlot: string;
  score: number;
  reasons: string[];
  bookable: boolean;
}

const STATUS_SCORE: Record<string, number> = {
  AVAILABLE: 40,
  "IN CONSULTATION": 26,
  "ON BREAK": 14,
  "FULLY BOOKED": 4,
  OFFLINE: 0,
};

/**
 * Suitability first, then availability, then wait time.
 * Wait time alone can never override care-category suitability.
 */
export function recommendDoctors(
  entries: QueueEntry[],
  doctors: Doctor[],
  opts: { hospitalId: string; department: string; priority?: boolean },
): DoctorOption[] {
  const pool = doctors.filter(
    (d) => d.hospitalId === opts.hospitalId && d.department === opts.department,
  );
  const options = pool.map((doctor) => {
    const { minutes, ahead } = calculateWaitTime(entries, doctor);
    const { waiting } = getQueueStatus(entries, doctor.id);
    const reasons: string[] = ["Appropriate specialization for the suggested care category"];
    if (doctor.status === "AVAILABLE") reasons.push("Currently available");
    if (doctor.status === "IN CONSULTATION") reasons.push("Currently consulting, queue moving");
    if (doctor.status === "ON BREAK") reasons.push("On a short break");
    if (doctor.experience >= 12) reasons.push(`${doctor.experience} years of experience`);

    const waitScore = Math.max(0, 40 - minutes * 0.6);
    const slotScore = doctor.slots.length ? 10 : 0;
    const priorityBoost = opts.priority && doctor.status === "AVAILABLE" ? 8 : 0;
    const score = (STATUS_SCORE[doctor.status] ?? 0) + waitScore + slotScore + priorityBoost + doctor.experience * 0.3;

    return {
      doctor,
      ahead: waiting.length,
      wait: minutes,
      nextSlot: doctor.slots[0] ?? "No slots today",
      score: Math.round(score),
      reasons,
      bookable: doctor.status !== "OFFLINE" && doctor.status !== "FULLY BOOKED" && doctor.slots.length > 0,
    } satisfies DoctorOption;
  });

  return options.sort((a, b) => b.score - a.score);
}

export function sortOptions(options: DoctorOption[], mode: "recommended" | "wait" | "slot") {
  const copy = [...options];
  if (mode === "wait") return copy.sort((a, b) => a.wait - b.wait || b.score - a.score);
  if (mode === "slot") return copy.sort((a, b) => a.nextSlot.localeCompare(b.nextSlot) || b.score - a.score);
  return copy.sort((a, b) => b.score - a.score);
}

/** Detects queue imbalance between doctors in the same care category. */
export function queueImbalance(entries: QueueEntry[], doctors: Doctor[], hospitalId: string) {
  const byDept = new Map<string, Doctor[]>();
  for (const d of doctors.filter((x) => x.hospitalId === hospitalId)) {
    byDept.set(d.department, [...(byDept.get(d.department) ?? []), d]);
  }
  const out: { department: string; busiest: string; busiestWait: number; lightest: string; lightestWait: number }[] = [];
  for (const [department, docs] of byDept) {
    if (docs.length < 2) continue;
    const waits = docs
      .map((d) => ({ name: d.name, wait: calculateWaitTime(entries, d).minutes, status: d.status }))
      .filter((d) => d.status !== "OFFLINE")
      .sort((a, b) => a.wait - b.wait);
    const lightest = waits[0];
    const busiest = waits[waits.length - 1];
    if (!lightest || !busiest || busiest.wait - lightest.wait < 15) continue;
    out.push({
      department,
      busiest: busiest.name,
      busiestWait: busiest.wait,
      lightest: lightest.name,
      lightestWait: lightest.wait,
    });
  }
  return out;
}