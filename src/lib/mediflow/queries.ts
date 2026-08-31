/**
 * Shared read-only query layer over the Mediflow demo dataset.
 *
 * Both the MCP tools (src/lib/mcp/*, which read the static seed snapshot) and
 * the in-app Ask Mediflow assistant (which reads the live store) call these
 * functions, so answers stay consistent as the underlying data changes.
 */
import { HOSPITALS } from "./data";
import { calculateWaitTime, departmentLoad, getQueueStatus } from "./queue";
import { evaluateScreening } from "./screening";
import { recommendDoctors } from "./recommendation";
import type { Doctor, QueueEntry } from "./types";

export const DISCLAIMER =
  "Mediflow provides care navigation with synthetic demo data only. It is not a medical diagnosis.";

export function doctorSnapshot(doctor: Doctor, entries: QueueEntry[]) {
  const { minutes, ahead } = calculateWaitTime(entries, doctor);
  const { waiting, completed } = getQueueStatus(entries, doctor.id);
  return {
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.specialization,
    department: doctor.department,
    hospital_id: doctor.hospitalId,
    hospital: HOSPITALS.find((h) => h.id === doctor.hospitalId)?.name ?? doctor.hospitalId,
    experience_years: doctor.experience,
    consultation_fee_inr: doctor.fee,
    status: doctor.status,
    patients_ahead: ahead,
    waiting_count: waiting.length,
    completed_today: completed.length,
    estimated_wait_minutes: minutes,
    next_slot: doctor.slots[0] ?? "No slots today",
  };
}

export function listDoctors(
  entries: QueueEntry[],
  doctors: Doctor[],
  opts: { hospitalId?: string; department?: string } = {},
) {
  let pool = doctors;
  if (opts.hospitalId) pool = pool.filter((d) => d.hospitalId === opts.hospitalId);
  if (opts.department) {
    const needle = opts.department.trim().toLowerCase();
    pool = pool.filter((d) => d.department.toLowerCase() === needle);
  }
  return pool.map((d) => doctorSnapshot(d, entries));
}

export function shortestWait(
  entries: QueueEntry[],
  doctors: Doctor[],
  opts: { hospitalId?: string; department?: string; limit?: number } = {},
) {
  const rows = listDoctors(entries, doctors, opts).sort(
    (a, b) => a.estimated_wait_minutes - b.estimated_wait_minutes,
  );
  const limit = Math.min(Math.max(opts.limit ?? 5, 1), 20);
  return rows.slice(0, limit);
}

export function trackToken(entries: QueueEntry[], doctors: Doctor[], token: string) {
  const needle = token.trim().toUpperCase();
  const entry = entries.find((e) => e.token.toUpperCase() === needle);
  if (!entry) return null;
  const doctor = doctors.find((d) => d.id === entry.doctorId);
  const { waiting } = getQueueStatus(entries, entry.doctorId);
  const position = waiting.findIndex((e) => e.id === entry.id);
  const wait = doctor ? calculateWaitTime(entries, doctor, entry.id) : { minutes: 0, ahead: 0 };
  return {
    token: entry.token,
    status: entry.status,
    patient_name: entry.patientName,
    concern: entry.concern,
    priority: entry.priority,
    doctor: doctor?.name ?? entry.doctorId,
    department: doctor?.department ?? null,
    hospital_id: entry.hospitalId,
    position_in_queue: position >= 0 ? position + 1 : null,
    patients_ahead: wait.ahead,
    estimated_wait_minutes: entry.status === "waiting" ? wait.minutes : 0,
  };
}

export function navigateCare(
  entries: QueueEntry[],
  doctors: Doctor[],
  opts: {
    hospitalId: string;
    symptomIds: string[];
    answers?: Record<string, string>;
    freeText?: string;
  },
) {
  const result = evaluateScreening(opts.symptomIds, opts.answers ?? {}, opts.freeText ?? "");
  const options = recommendDoctors(entries, doctors, {
    hospitalId: opts.hospitalId,
    department: result.department,
  }).map((o) => ({
    id: o.doctor.id,
    name: o.doctor.name,
    specialization: o.doctor.specialization,
    status: o.doctor.status,
    consultation_fee_inr: o.doctor.fee,
    patients_ahead: o.ahead,
    estimated_wait_minutes: o.wait,
    next_slot: o.nextSlot,
    match_score: o.score,
    reasons: o.reasons,
    bookable: o.bookable,
  }));
  return {
    urgent: result.urgent,
    urgent_message: result.urgent
      ? "Emergency signs were reported. Please seek immediate medical attention at the emergency department."
      : null,
    care_category: result.department,
    reasons: result.reasons,
    reported: result.answered,
    recommended_doctors: options,
    disclaimer: DISCLAIMER,
  };
}

export function hospitalLoad(entries: QueueEntry[], doctors: Doctor[], hospitalId: string) {
  return departmentLoad(entries, doctors, hospitalId);
}

export function listHospitals(entries: QueueEntry[], doctors: Doctor[]) {
  return HOSPITALS.map((h) => ({
    id: h.id,
    name: h.name,
    city: h.city,
    open_hours: h.openHours,
    open_now: h.open,
    department_load: hospitalLoad(entries, doctors, h.id),
  }));
}
