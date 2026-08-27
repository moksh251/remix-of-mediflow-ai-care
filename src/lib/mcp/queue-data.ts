/** Shared read-only view of the Mediflow demo dataset for MCP tools. */
import { DOCTORS, HOSPITALS, seedQueue } from "@/lib/mediflow/data";
import { calculateWaitTime, departmentLoad, getQueueStatus } from "@/lib/mediflow/queue";
import type { Doctor } from "@/lib/mediflow/types";

export const DISCLAIMER =
  "Mediflow provides care navigation with synthetic demo data only. It is not a medical diagnosis.";

export function entries() {
  return seedQueue();
}

export function hospitals() {
  return HOSPITALS;
}

export function doctorsFor(hospitalId?: string) {
  return hospitalId ? DOCTORS.filter((d) => d.hospitalId === hospitalId) : DOCTORS;
}

export function doctorSnapshot(doctor: Doctor) {
  const list = entries();
  const { minutes, ahead } = calculateWaitTime(list, doctor);
  const { waiting, completed } = getQueueStatus(list, doctor.id);
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

export function hospitalLoad(hospitalId: string) {
  return departmentLoad(entries(), DOCTORS, hospitalId);
}
