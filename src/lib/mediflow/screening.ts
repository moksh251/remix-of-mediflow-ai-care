export interface ScreeningQuestion {
  id: string;
  text: string;
  options: string[];
  urgent?: string[];
  specialist?: string[];
}

export interface SymptomConfig {
  id: string;
  label: string;
  icon: string;
  baseDepartment: string;
  specialistDepartment?: string;
  questions: ScreeningQuestion[];
}

const durations = ["Less than 1 day", "1-2 days", "3-7 days", "More than a week"];
const severity = ["Mild", "Moderate", "Severe"];
const yn = ["Yes", "No"];

export const SYMPTOMS: SymptomConfig[] = [
  {
    id: "fever", label: "Fever", icon: "thermometer", baseDepartment: "General Medicine",
    questions: [
      { id: "duration", text: "How long have you had the fever?", options: durations },
      { id: "temp", text: "Highest recorded temperature?", options: ["Not measured", "Below 100F", "100-102F", "Above 102F"] },
      { id: "chills", text: "Any chills?", options: yn },
      { id: "cough", text: "Any cough?", options: yn },
      { id: "vomiting", text: "Any vomiting?", options: yn },
      { id: "bodypain", text: "Any body pain?", options: yn },
      { id: "breathing", text: "Any difficulty breathing?", options: yn, urgent: ["Yes"] },
      { id: "rash", text: "Any rash?", options: yn },
    ],
  },
  {
    id: "headache", label: "Headache", icon: "brain",
    baseDepartment: "General Medicine", specialistDepartment: "Neurology",
    questions: [
      { id: "duration", text: "Since when have you had the headache?", options: durations, specialist: ["More than a week"] },
      { id: "severity", text: "How severe is it?", options: severity, specialist: ["Severe"] },
      { id: "fever", text: "Do you have a fever?", options: yn },
      { id: "vomiting", text: "Any vomiting?", options: yn, specialist: ["Yes"] },
      { id: "vision", text: "Any changes in your vision?", options: yn, specialist: ["Yes"] },
      { id: "injury", text: "Any recent head injury?", options: yn, urgent: ["Yes"] },
      { id: "sudden", text: "Did it start suddenly and very severely?", options: yn, urgent: ["Yes"] },
      { id: "weakness", text: "Any weakness or numbness in the face, arm or leg?", options: yn, urgent: ["Yes"] },
      { id: "speech", text: "Any difficulty speaking?", options: yn, urgent: ["Yes"] },
    ],
  },
  {
    id: "stomach", label: "Stomach Pain", icon: "activity",
    baseDepartment: "General Medicine", specialistDepartment: "Gastroenterology",
    questions: [
      { id: "duration", text: "How long have you had the stomach pain?", options: durations, specialist: ["1-2 days", "3-7 days", "More than a week"] },
      { id: "location", text: "Where exactly is the pain?", options: ["Upper abdomen", "Around the navel", "Lower abdomen", "All over"], specialist: ["Upper abdomen"] },
      { id: "severity", text: "How severe is the pain right now?", options: severity },
      { id: "vomiting", text: "Are you vomiting?", options: yn, specialist: ["Yes"] },
      { id: "fever", text: "Do you also have a fever?", options: yn },
      { id: "diarrhea", text: "Any diarrhea?", options: yn },
      { id: "blood", text: "Any blood in stool or vomit?", options: yn, urgent: ["Yes"] },
      { id: "worse", text: "Is the pain getting worse?", options: yn, specialist: ["Yes"] },
    ],
  },
  {
    id: "vomiting", label: "Vomiting", icon: "droplet",
    baseDepartment: "General Medicine", specialistDepartment: "Gastroenterology",
    questions: [
      { id: "duration", text: "How long have you been vomiting?", options: durations, specialist: ["3-7 days", "More than a week"] },
      { id: "frequency", text: "How many times in the last 24 hours?", options: ["1-2", "3-5", "More than 5"], specialist: ["More than 5"] },
      { id: "blood", text: "Any blood in the vomit?", options: yn, urgent: ["Yes"] },
      { id: "fluids", text: "Are you able to keep fluids down?", options: yn, urgent: ["No"] },
      { id: "pain", text: "Any stomach pain along with it?", options: yn, specialist: ["Yes"] },
    ],
  },
  {
    id: "cough", label: "Cough / Cold", icon: "wind", baseDepartment: "General Medicine",
    questions: [
      { id: "duration", text: "How long have you had the cough or cold?", options: durations },
      { id: "fever", text: "Any fever?", options: yn },
      { id: "breathing", text: "Any difficulty breathing?", options: yn, urgent: ["Yes"] },
      { id: "chest", text: "Any chest discomfort?", options: yn, urgent: ["Yes"] },
      { id: "phlegm", text: "Any phlegm?", options: yn },
      { id: "blood", text: "Any blood when you cough?", options: yn, urgent: ["Yes"] },
      { id: "severity", text: "How severe is it?", options: severity },
    ],
  },
  {
    id: "breathing", label: "Breathing Difficulty", icon: "lungs", baseDepartment: "General Medicine",
    questions: [
      { id: "onset", text: "When did the breathing difficulty start?", options: ["Just now / today", "1-2 days", "More than 2 days"], urgent: ["Just now / today"] },
      { id: "rest", text: "Is it present even at rest?", options: yn, urgent: ["Yes"] },
      { id: "speak", text: "Are you able to speak full sentences?", options: yn, urgent: ["No"] },
      { id: "lips", text: "Any bluish lips or fingertips?", options: yn, urgent: ["Yes"] },
      { id: "chest", text: "Any chest discomfort along with it?", options: yn, urgent: ["Yes"] },
    ],
  },
  {
    id: "chest", label: "Chest Discomfort", icon: "heart", baseDepartment: "General Medicine",
    questions: [
      { id: "onset", text: "When did the chest discomfort start?", options: ["Within the last hour", "Today", "More than a day ago"], urgent: ["Within the last hour", "Today"] },
      { id: "spread", text: "Does it spread to the arm, jaw, neck or back?", options: yn, urgent: ["Yes"] },
      { id: "breathless", text: "Any breathlessness with it?", options: yn, urgent: ["Yes"] },
      { id: "sweating", text: "Any sweating, nausea or dizziness?", options: yn, urgent: ["Yes"] },
      { id: "severity", text: "How severe is the discomfort?", options: severity, urgent: ["Severe"] },
    ],
  },
  {
    id: "pregnancy", label: "Pregnancy-related Concern", icon: "baby", baseDepartment: "Gynecology",
    questions: [
      { id: "stage", text: "Which stage of pregnancy?", options: ["First trimester", "Second trimester", "Third trimester", "Not sure"] },
      { id: "pain", text: "Any abdominal pain?", options: yn },
      { id: "bleeding", text: "Any bleeding?", options: yn, urgent: ["Yes"] },
      { id: "contractions", text: "Any contractions?", options: yn, urgent: ["Yes"] },
      { id: "fluid", text: "Any fluid leakage?", options: yn, urgent: ["Yes"] },
      { id: "headache", text: "Any severe headache?", options: yn, urgent: ["Yes"] },
      { id: "vision", text: "Any changes in vision?", options: yn, urgent: ["Yes"] },
      { id: "other", text: "Any other concern you want noted?", options: ["Routine check-up", "Medication question", "General discomfort", "None"] },
    ],
  },
  {
    id: "child", label: "Child Health Concern", icon: "child", baseDepartment: "Pediatrics",
    questions: [
      { id: "age", text: "What is the child's age?", options: ["Under 1 year", "1-5 years", "6-10 years", "11-17 years"] },
      { id: "fever", text: "Does the child have a fever?", options: yn },
      { id: "temp", text: "Highest recorded temperature?", options: ["Not measured", "Below 100F", "100-102F", "Above 102F"] },
      { id: "duration", text: "For how long?", options: durations },
      { id: "vomiting", text: "Any vomiting?", options: yn },
      { id: "breathing", text: "Any difficulty breathing?", options: yn, urgent: ["Yes"] },
      { id: "intake", text: "Is the child eating and drinking normally?", options: yn, urgent: ["No"] },
      { id: "sleepy", text: "Is the child unusually sleepy or hard to wake?", options: yn, urgent: ["Yes"] },
      { id: "rash", text: "Any rash?", options: yn },
    ],
  },
  {
    id: "joint", label: "Joint / Muscle Pain", icon: "bone", baseDepartment: "General Medicine",
    questions: [
      { id: "duration", text: "How long have you had the pain?", options: durations },
      { id: "where", text: "Which area is affected?", options: ["Knee", "Shoulder", "Back", "Multiple joints"] },
      { id: "swelling", text: "Any swelling?", options: yn },
      { id: "injury", text: "Any recent injury?", options: yn },
      { id: "severity", text: "How severe is the pain?", options: severity },
    ],
  },
  {
    id: "skin", label: "Skin Problem", icon: "sparkles", baseDepartment: "General Medicine",
    questions: [
      { id: "duration", text: "How long has the skin problem been present?", options: durations },
      { id: "type", text: "What do you notice?", options: ["Rash", "Itching", "Dryness", "Swelling"] },
      { id: "fever", text: "Any fever with it?", options: yn },
      { id: "spread", text: "Is it spreading?", options: yn },
      { id: "breathing", text: "Any facial swelling or breathing difficulty?", options: yn, urgent: ["Yes"] },
    ],
  },
  {
    id: "eye", label: "Eye Problem", icon: "eye", baseDepartment: "General Medicine",
    questions: [
      { id: "duration", text: "How long has the eye problem been present?", options: durations },
      { id: "type", text: "What do you notice?", options: ["Redness", "Pain", "Watering", "Blurred vision"] },
      { id: "injury", text: "Any injury to the eye?", options: yn, urgent: ["Yes"] },
      { id: "vision", text: "Any sudden loss of vision?", options: yn, urgent: ["Yes"] },
    ],
  },
  {
    id: "ent", label: "ENT Problem", icon: "ear", baseDepartment: "General Medicine",
    questions: [
      { id: "duration", text: "How long has this been present?", options: durations },
      { id: "area", text: "Which area?", options: ["Ear", "Nose", "Throat"] },
      { id: "fever", text: "Any fever?", options: yn },
      { id: "swallow", text: "Any difficulty swallowing or breathing?", options: yn, urgent: ["Yes"] },
    ],
  },
  {
    id: "checkup", label: "General Check-up", icon: "clipboard", baseDepartment: "General Medicine",
    questions: [
      { id: "reason", text: "What is the check-up for?", options: ["Routine", "Follow-up", "Report review", "Fitness certificate"] },
      { id: "conditions", text: "Any known ongoing conditions?", options: ["None", "Diabetes", "Blood pressure", "Other"] },
      { id: "meds", text: "Are you currently on any medication?", options: yn },
    ],
  },
  {
    id: "other", label: "Other", icon: "plus", baseDepartment: "General Medicine",
    questions: [
      { id: "duration", text: "How long has the concern been present?", options: durations },
      { id: "severity", text: "How would you rate it?", options: severity },
      { id: "worse", text: "Is it getting worse?", options: yn },
    ],
  },
];

export interface ScreeningResult {
  urgent: boolean;
  department: string;
  reasons: string[];
  answered: { label: string; value: string }[];
}

export function evaluateScreening(
  symptomIds: string[],
  answers: Record<string, string>,
  freeText: string,
): ScreeningResult {
  const configs = SYMPTOMS.filter((s) => symptomIds.includes(s.id));
  let urgent = false;
  let department = configs[0]?.baseDepartment ?? "General Medicine";
  const reasons: string[] = [];
  const answered: { label: string; value: string }[] = [];

  for (const config of configs) {
    let specialistPoints = 0;
    for (const q of config.questions) {
      const answer = answers[`${config.id}:${q.id}`];
      if (!answer) continue;
      answered.push({ label: q.text, value: answer });
      if (q.urgent?.includes(answer)) {
        urgent = true;
        reasons.push(`${q.text} - ${answer}`);
      }
      if (q.specialist?.includes(answer)) specialistPoints += 1;
    }
    if (config.specialistDepartment && specialistPoints >= 2) {
      department = config.specialistDepartment;
    } else if (config.baseDepartment !== "General Medicine") {
      department = config.baseDepartment;
    }
  }

  if (freeText.trim()) answered.push({ label: "Additional description", value: freeText.trim() });
  return { urgent, department, reasons, answered };
}

export function buildPatientSummary(
  symptomIds: string[],
  answers: Record<string, string>,
  department: string,
) {
  const configs = SYMPTOMS.filter((s) => symptomIds.includes(s.id));
  const primary = configs[0];
  const clean = (t: string) =>
    t.replace(/^(Any|Are you|Do you|Does the child|Is the|How|What|When|Which|Since)\s+/i, "").replace(/\?$/, "");
  const duration =
    (primary && (answers[`${primary.id}:duration`] ?? answers[`${primary.id}:onset`] ?? answers[`${primary.id}:stage`])) || "";
  const reported = primary
    ? primary.questions.filter((q) => answers[`${primary.id}:${q.id}`] === "Yes").map((q) => clean(q.text))
    : [];
  const denied = primary
    ? primary.questions.filter((q) => answers[`${primary.id}:${q.id}`] === "No").map((q) => clean(q.text))
    : [];

  let text = `Patient reports ${configs.map((c) => c.label.toLowerCase()).join(" and ")}`;
  if (duration) text += ` for approximately ${duration.toLowerCase()}`;
  text += ".";
  if (reported.length) text += ` Reported: ${reported.slice(0, 3).join(", ")}.`;
  if (denied.length) text += ` Not reported: ${denied.slice(0, 3).join(", ")}.`;
  text += ` Care navigation: ${department}.`;
  return text;
}