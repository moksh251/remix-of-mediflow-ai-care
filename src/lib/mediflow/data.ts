import type { Doctor, Hospital, QueueEntry, ScreeningSnapshot } from "./types";

export const HOSPITALS: Hospital[] = [
  { id: "h1", name: "Mediflow City Hospital", city: "Ahmedabad", openHours: "08:00 – 21:00", open: true },
  { id: "h2", name: "CarePoint Hospital", city: "Pune", openHours: "09:00 – 20:00", open: true },
  { id: "h3", name: "Aarogya Multispeciality", city: "Surat", openHours: "08:30 – 19:30", open: true },
  { id: "h4", name: "LifeBridge Hospital", city: "Nagpur", openHours: "09:00 – 18:00", open: true },
  { id: "h5", name: "Unity Medical Center", city: "Indore", openHours: "10:00 – 17:00", open: false },
];

const slots = (start: number, count: number) => {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const total = start + i * 20;
    const h = Math.floor(total / 60);
    const m = total % 60;
    const suffix = h >= 12 ? "PM" : "AM";
    const hh = h > 12 ? h - 12 : h;
    out.push(`${hh}:${String(m).padStart(2, "0")} ${suffix}`);
  }
  return out;
};

/** Fictional demo doctors — synthetic data for demonstration only. */
export const DOCTORS: Doctor[] = [
  {
    id: "d1", name: "Dr. Rajesh Mehta", specialization: "General Physician (MBBS)", department: "General Medicine",
    hospitalId: "h1", experience: 12, fee: 400, avgDuration: 8, status: "IN CONSULTATION",
    slots: slots(15 * 60 + 20, 8), consultStartedMinutesAgo: 3,
  },
  {
    id: "d2", name: "Dr. Amit Shah", specialization: "General Physician (MBBS)", department: "General Medicine",
    hospitalId: "h1", experience: 8, fee: 350, avgDuration: 10, status: "AVAILABLE", slots: slots(15 * 60, 8),
  },
  {
    id: "d3", name: "Dr. Priya Desai", specialization: "Gynecologist", department: "Gynecology",
    hospitalId: "h1", experience: 14, fee: 700, avgDuration: 14, status: "AVAILABLE", slots: slots(15 * 60 + 40, 6),
  },
  {
    id: "d4", name: "Dr. Neha Patel", specialization: "Gynecologist", department: "Gynecology",
    hospitalId: "h1", experience: 10, fee: 600, avgDuration: 12, status: "IN CONSULTATION",
    slots: slots(16 * 60, 6), consultStartedMinutesAgo: 6,
  },
  {
    id: "d5", name: "Dr. Suresh Patel", specialization: "Gastroenterologist", department: "Gastroenterology",
    hospitalId: "h1", experience: 16, fee: 500, avgDuration: 6, status: "AVAILABLE", slots: slots(15 * 60 + 40, 6),
  },
  {
    id: "d6", name: "Dr. Ashish Joshi", specialization: "Gastroenterologist", department: "Gastroenterology",
    hospitalId: "h1", experience: 11, fee: 450, avgDuration: 7, status: "IN CONSULTATION",
    slots: slots(17 * 60, 5), consultStartedMinutesAgo: 4,
  },
  {
    id: "d7", name: "Dr. Kavita Mehta", specialization: "Pediatrician", department: "Pediatrics",
    hospitalId: "h1", experience: 13, fee: 550, avgDuration: 6, status: "AVAILABLE", slots: slots(15 * 60 + 20, 7),
  },
  {
    id: "d8", name: "Dr. Rohan Shah", specialization: "Pediatrician", department: "Pediatrics",
    hospitalId: "h1", experience: 7, fee: 450, avgDuration: 8, status: "IN CONSULTATION",
    slots: slots(16 * 60 + 20, 5), consultStartedMinutesAgo: 2,
  },
  {
    id: "d9", name: "Dr. Anjali Desai", specialization: "Neurologist", department: "Neurology",
    hospitalId: "h1", experience: 15, fee: 900, avgDuration: 15, status: "AVAILABLE", slots: slots(16 * 60, 5),
  },
  {
    id: "d10", name: "Dr. Vivek Shah", specialization: "Neurologist", department: "Neurology",
    hospitalId: "h1", experience: 18, fee: 1100, avgDuration: 18, status: "ON BREAK", slots: slots(17 * 60, 4),
  },
  // Other demo hospitals (independent doctors, queues, fees)
  {
    id: "d11", name: "Dr. Meera Kulkarni", specialization: "General Physician (MBBS)", department: "General Medicine",
    hospitalId: "h2", experience: 9, fee: 300, avgDuration: 9, status: "AVAILABLE", slots: slots(15 * 60, 6),
  },
  {
    id: "d12", name: "Dr. Farhan Qureshi", specialization: "Gastroenterologist", department: "Gastroenterology",
    hospitalId: "h2", experience: 12, fee: 480, avgDuration: 8, status: "AVAILABLE", slots: slots(15 * 60 + 30, 5),
  },
  {
    id: "d13", name: "Dr. Sneha Rao", specialization: "Pediatrician", department: "Pediatrics",
    hospitalId: "h3", experience: 11, fee: 420, avgDuration: 7, status: "AVAILABLE", slots: slots(15 * 60, 6),
  },
  {
    id: "d14", name: "Dr. Karan Bhatt", specialization: "Gynecologist", department: "Gynecology",
    hospitalId: "h4", experience: 13, fee: 520, avgDuration: 12, status: "AVAILABLE", slots: slots(15 * 60, 5),
  },
];

const names = [
  "Aarav Shah", "Ishita Rao", "Vikram Nair", "Riya Menon", "Kabir Sethi", "Ananya Bose",
  "Rehan Khan", "Diya Kapoor", "Manav Trivedi", "Sara Iyer", "Nikhil Rane", "Tara Bhatt",
  "Om Prakash", "Zoya Mirza", "Yash Solanki", "Naina Gupta", "Arjun Pillai", "Mira Joshi",
  "Dev Malhotra", "Pooja Verma", "Rahul Sinha", "Kritika Jain", "Aman Kohli", "Sneha Dutta",
];
const concerns = ["Fever", "Stomach Pain", "Cough / Cold", "Headache", "Joint / Muscle Pain", "General Check-up"];

/** Demo screening snapshots attached to seeded queue entries so the doctor
 * console shows urgency, emergency signs and the full answer list on first
 * load — not just for patients booked through the app in the current session. */
const SCREENING_BY_DEPT: Record<string, ScreeningSnapshot> = {
  Gastroenterology: {
    urgency: "urgent",
    department: "Gastroenterology",
    reasons: ["Any blood in stool or vomit? - Yes"],
    answers: [
      { label: "How long have you had the stomach pain?", value: "1-2 days" },
      { label: "Where exactly is the pain?", value: "Upper abdomen" },
      { label: "How severe is the pain right now?", value: "Severe" },
      { label: "Any blood in stool or vomit?", value: "Yes" },
    ],
  },
  "General Medicine": {
    urgency: "routine",
    department: "General Medicine",
    reasons: [],
    answers: [
      { label: "How long have you had the fever?", value: "1-2 days" },
      { label: "Highest recorded temperature?", value: "100-102F" },
      { label: "Any chills?", value: "Yes" },
      { label: "Any cough?", value: "No" },
      { label: "Any difficulty breathing?", value: "No" },
    ],
  },
  Neurology: {
    urgency: "routine",
    department: "Neurology",
    reasons: [],
    answers: [
      { label: "Since when have you had the headache?", value: "More than a week" },
      { label: "How severe is it?", value: "Severe" },
      { label: "Any vomiting?", value: "No" },
      { label: "Any changes in your vision?", value: "No" },
    ],
  },
  Pediatrics: {
    urgency: "urgent",
    department: "Pediatrics",
    reasons: ["Any difficulty breathing? - Yes"],
    answers: [
      { label: "What is the child's age?", value: "1-5 years" },
      { label: "Does the child have a fever?", value: "Yes" },
      { label: "Highest recorded temperature?", value: "Above 102F" },
      { label: "Any difficulty breathing?", value: "Yes" },
    ],
  },
  Gynecology: {
    urgency: "routine",
    department: "Gynecology",
    reasons: [],
    answers: [
      { label: "Which stage of pregnancy?", value: "Second trimester" },
      { label: "Any abdominal pain?", value: "No" },
      { label: "Any bleeding?", value: "No" },
      { label: "Any other concern you want noted?", value: "Routine check-up" },
    ],
  },
};

function screeningFor(department: string): ScreeningSnapshot | undefined {
  return SCREENING_BY_DEPT[department];
}

function summaryFor(concern: string, screening?: ScreeningSnapshot): string {
  const prefix = screening?.urgency === "urgent" ? "URGENT — " : "";
  return `${prefix}Patient reports ${concern.toLowerCase()}.${screening ? ` Care navigation: ${screening.department}.` : ""}`;
}

/** Deterministic seeded queue so SSR and client render identically. */
export function seedQueue(): QueueEntry[] {
  const perDoctor: Record<string, number> = {
    d1: 6, d2: 4, d3: 5, d4: 7, d5: 3, d6: 8, d7: 2, d8: 4, d9: 3, d10: 2,
    d11: 3, d12: 2, d13: 3, d14: 2,
  };
  const entries: QueueEntry[] = [];
  let n = 0;
  const counters: Record<string, number> = {};
  for (const doc of DOCTORS) {
    const count = perDoctor[doc.id] ?? 2;
    // completed history for analytics
    const done = (doc.experience % 3) + 2;
    for (let i = 0; i < done; i++) {
      counters[doc.hospitalId] = (counters[doc.hospitalId] ?? 100) + 1;
      entries.push({
        id: `s${n}`, token: tokenFor(doc.hospitalId, counters[doc.hospitalId]!), hospitalId: doc.hospitalId,
        doctorId: doc.id, patientName: names[n % names.length]!, age: 20 + ((n * 7) % 55),
        concern: concerns[n % concerns.length]!, priority: false,
        status: n % 11 === 0 ? "no_show" : "completed", createdAtMin: 9 * 60 + n * 4, source: "reception",
      });
      n++;
    }
    if (doc.status === "IN CONSULTATION") {
      counters[doc.hospitalId] = (counters[doc.hospitalId] ?? 100) + 1;
      const concern = concerns[(n + 1) % concerns.length]!;
      const screening = screeningFor(doc.department);
      entries.push({
        id: `s${n}`, token: tokenFor(doc.hospitalId, counters[doc.hospitalId]!), hospitalId: doc.hospitalId,
        doctorId: doc.id, patientName: names[(n + 3) % names.length]!, age: 18 + ((n * 5) % 60),
        concern, priority: false, status: "in_consultation",
        createdAtMin: 14 * 60, source: "reception",
        summary: summaryFor(concern, screening), screening,
      });
      n++;
    }
    for (let i = 0; i < count; i++) {
      counters[doc.hospitalId] = (counters[doc.hospitalId] ?? 100) + 1;
      const concern = concerns[(n + 2) % concerns.length]!;
      // Attach a screening snapshot to the first waiting patient for a few
      // doctors so the "next patient" panel also shows rich screening data.
      const screening = i === 0 && (doc.id === "d5" || doc.id === "d9") ? screeningFor(doc.department) : undefined;
      entries.push({
        id: `s${n}`, token: tokenFor(doc.hospitalId, counters[doc.hospitalId]!), hospitalId: doc.hospitalId,
        doctorId: doc.id, patientName: names[(n + 5) % names.length]!, age: 16 + ((n * 11) % 62),
        concern, priority: false, status: "waiting",
        createdAtMin: 14 * 60 + i * 3, source: i % 3 === 0 ? "patient-app" : "reception",
        summary: screening ? summaryFor(concern, screening) : undefined, screening,
      });
      n++;
    }
  }
  return entries;
}

export function tokenFor(hospitalId: string, n: number) {
  const prefix = { h1: "A", h2: "B", h3: "C", h4: "D", h5: "E" }[hospitalId] ?? "A";
  return `${prefix}-${n}`;
}