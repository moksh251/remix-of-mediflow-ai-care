export type DoctorStatus =
  | "AVAILABLE"
  | "IN CONSULTATION"
  | "ON BREAK"
  | "OFFLINE"
  | "FULLY BOOKED";

export type Department =
  | "General Medicine"
  | "Gastroenterology"
  | "Gynecology"
  | "Pediatrics"
  | "Neurology";

export interface Hospital {
  id: string;
  name: string;
  city: string;
  openHours: string;
  open: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: Department;
  hospitalId: string;
  experience: number;
  fee: number;
  avgDuration: number; // minutes
  status: DoctorStatus;
  slots: string[];
  consultStartedMinutesAgo?: number | undefined;
}

export type QueueStatus = "waiting" | "in_consultation" | "completed" | "no_show";

export interface ScreeningSnapshot {
  urgency: "routine" | "urgent";
  department: string;
  reasons: string[];
  answers: { label: string; value: string }[];
}

export interface QueueEntry {
  id: string;
  token: string;
  hospitalId: string;
  doctorId: string;
  patientName: string;
  age: number;
  concern: string;
  priority: boolean;
  status: QueueStatus;
  createdAtMin: number; // minutes since day start (simulated clock)
  source: "patient-app" | "reception";
  summary?: string | undefined;
  eta?: number | undefined;
  screening?: ScreeningSnapshot | undefined;
}

export interface Booking {
  id: string;
  bookingId: string;
  token: string;
  entryId: string;
  doctorId: string;
  hospitalId: string;
  patientName: string;
  slot: string;
  fee: number;
  paid: boolean;
  txn?: string | undefined;
  method?: string | undefined;
}

export interface PatientDetails {
  name: string;
  age: number | "";
  sex: string;
  height: string;
  weight: string;
  phone: string;
  hospitalId: string;
}

export interface StaffAlert {
  id: string;
  title: string;
  detail: string;
  etaMinutes: number;
  level: "priority" | "info";
  acknowledged: boolean;
}