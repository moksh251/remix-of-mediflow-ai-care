import { useSyncExternalStore } from "react";
import { DOCTORS, HOSPITALS, seedQueue, tokenFor } from "./data";
import type { Booking, Doctor, DoctorStatus, QueueEntry, StaffAlert } from "./types";
import { getQueueStatus } from "./queue";

export interface MediflowState {
  doctors: Doctor[];
  entries: QueueEntry[];
  bookings: Booking[];
  alerts: StaffAlert[];
  activeHospitalId: string;
  lastUpdatedTick: number;
  counter: number;
}

let state: MediflowState = {
  doctors: DOCTORS.map((d) => ({ ...d })),
  entries: seedQueue(),
  bookings: [],
  alerts: [
    {
      id: "al-seed",
      title: "Equipment check due",
      detail: "Gastroenterology room 2 scheduled maintenance window.",
      etaMinutes: 45,
      level: "info",
      acknowledged: false,
    },
  ],
  activeHospitalId: "h1",
  lastUpdatedTick: 0,
  counter: 0,
};

const listeners = new Set<() => void>();
function emit() {
  listeners.add(() => {});
  listeners.forEach((l) => l());
}
function set(updater: (s: MediflowState) => MediflowState) {
  state = updater(state);
  emit();
}

export function useMediflow<T>(selector: (s: MediflowState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const getState = () => state;

export function setActiveHospital(hospitalId: string) {
  set((s) => ({ ...s, activeHospitalId: hospitalId }));
}

export function nextToken(hospitalId: string) {
  const used = state.entries
    .filter((e) => e.hospitalId === hospitalId)
    .map((e) => Number(e.token.split("-")[1] ?? 100));
  const max = used.length ? Math.max(...used) : 100;
  return tokenFor(hospitalId, max + 1);
}

export function addPatientToQueue(input: {
  hospitalId: string;
  doctorId: string;
  patientName: string;
  age: number;
  concern: string;
  priority?: boolean;
  summary?: string;
  source?: "patient-app" | "reception";
}): QueueEntry {
  const token = nextToken(input.hospitalId);
  const entry: QueueEntry = {
    id: `q-${state.counter + 1}-${token}`,
    token,
    hospitalId: input.hospitalId,
    doctorId: input.doctorId,
    patientName: input.patientName,
    age: input.age,
    concern: input.concern,
    priority: input.priority ?? false,
    status: "waiting",
    createdAtMin: 15 * 60 + state.counter,
    source: input.source ?? "patient-app",
    summary: input.summary,
  };
  set((s) => ({ ...s, entries: [...s.entries, entry], counter: s.counter + 1, lastUpdatedTick: s.lastUpdatedTick + 1 }));
  return entry;
}

export function removePatientFromQueue(entryId: string) {
  set((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== entryId), lastUpdatedTick: s.lastUpdatedTick + 1 }));
}

function setStatus(entryId: string, status: QueueEntry["status"]) {
  set((s) => ({
    ...s,
    entries: s.entries.map((e) => (e.id === entryId ? { ...e, status } : e)),
    lastUpdatedTick: s.lastUpdatedTick + 1,
  }));
}

export function markArrived(entryId: string) {
  setStatus(entryId, "waiting");
}
export function markNoShow(entryId: string) {
  setStatus(entryId, "no_show");
}

export function startConsultation(doctorId: string) {
  const { waiting, current } = getQueueStatus(state.entries, doctorId);
  if (current || !waiting.length) return;
  const next = waiting[0]!;
  set((s) => ({
    ...s,
    entries: s.entries.map((e) => (e.id === next.id ? { ...e, status: "in_consultation" } : e)),
    doctors: s.doctors.map((d) =>
      d.id === doctorId ? { ...d, status: "IN CONSULTATION", consultStartedMinutesAgo: 0 } : d,
    ),
    lastUpdatedTick: s.lastUpdatedTick + 1,
  }));
}

/** Completes the in-progress consultation and immediately pulls in the next patient. */
export function completePatient(doctorId: string) {
  const { current, waiting } = getQueueStatus(state.entries, doctorId);
  const next = waiting[0];
  set((s) => ({
    ...s,
    entries: s.entries.map((e) => {
      if (current && e.id === current.id) return { ...e, status: "completed" };
      if (next && e.id === next.id) return { ...e, status: "in_consultation" };
      return e;
    }),
    doctors: s.doctors.map((d) =>
      d.id === doctorId
        ? { ...d, status: next ? "IN CONSULTATION" : "AVAILABLE", consultStartedMinutesAgo: 0 }
        : d,
    ),
    lastUpdatedTick: s.lastUpdatedTick + 1,
  }));
}

export function updateDoctorStatus(doctorId: string, status: DoctorStatus) {
  set((s) => ({
    ...s,
    doctors: s.doctors.map((d) => (d.id === doctorId ? { ...d, status } : d)),
    lastUpdatedTick: s.lastUpdatedTick + 1,
  }));
}

export function addBooking(booking: Booking) {
  set((s) => ({ ...s, bookings: [...s.bookings, booking] }));
}

export function payBooking(bookingId: string, method: string) {
  const txn = `DEMO-TXN-${45000 + state.bookings.length * 37 + 821}`;
  set((s) => ({
    ...s,
    bookings: s.bookings.map((b) => (b.bookingId === bookingId ? { ...b, paid: true, txn, method } : b)),
  }));
  return txn;
}

export function addAlert(alert: Omit<StaffAlert, "id" | "acknowledged">) {
  set((s) => ({
    ...s,
    alerts: [{ ...alert, id: `al-${s.alerts.length + 1}`, acknowledged: false }, ...s.alerts],
  }));
}

export function acknowledgeAlert(id: string) {
  set((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }));
}

/** Advances the simulated clock: consultations progress, one finishes when due. */
export function tickSimulation() {
  const doctorsInConsult = state.doctors.filter((d) => d.status === "IN CONSULTATION");
  set((s) => ({
    ...s,
    doctors: s.doctors.map((d) =>
      d.status === "IN CONSULTATION"
        ? { ...d, consultStartedMinutesAgo: (d.consultStartedMinutesAgo ?? 0) + 2 }
        : d,
    ),
    lastUpdatedTick: s.lastUpdatedTick + 1,
  }));
  for (const doc of doctorsInConsult) {
    if ((doc.consultStartedMinutesAgo ?? 0) + 2 >= doc.avgDuration) completePatient(doc.id);
  }
}

/** Restores the seeded demo state. */
export function resetDemo() {
  set(() => ({
    doctors: DOCTORS.map((d) => ({ ...d })),
    entries: seedQueue(),
    bookings: [],
    alerts: [],
    activeHospitalId: state.activeHospitalId,
    lastUpdatedTick: 0,
    counter: 0,
  }));
}

export { HOSPITALS };