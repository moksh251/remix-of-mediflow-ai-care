import { defineTool } from "@lovable.dev/mcp-js";
import { ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { recommendDoctors } from "@/lib/mediflow/recommendation";
import { SYMPTOMS, evaluateScreening } from "@/lib/mediflow/screening";
import { DOCTORS } from "@/lib/mediflow/data";
import { DISCLAIMER, entries } from "../queue-data";

export default defineTool({
  name: "navigate_care",
  title: "Navigate to the right care category",
  description:
    "Run the Mediflow screening rules on reported symptoms and answers to suggest a care category (department) and the best matching doctors with waiting times. Never returns a diagnosis, medicine or treatment advice.",
  inputSchema: {
    hospital_id: z.string().describe("Hospital id such as h1..h5."),
    symptom_ids: z.array(z.string()).describe("Symptom ids from list_symptom_screenings, e.g. ['fever']."),
    answers: z
      .record(z.string(), z.string())
      .optional()
      .describe("Answers keyed as '<symptom_id>:<question_id>', e.g. {'fever:breathing':'Yes'}."),
    free_text: z.string().optional().describe("Anything else the patient described, in their own words."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ hospital_id, symptom_ids, answers, free_text }) => {
    const known = new Set(SYMPTOMS.map((s) => s.id));
    const ids = symptom_ids.map((s) => s.trim().toLowerCase());
    const unknown = ids.filter((s) => !known.has(s));
    if (unknown.length) throw new ToolError(`Unknown symptom id(s): ${unknown.join(", ")}`);

    const result = evaluateScreening(ids, answers ?? {}, free_text ?? "");
    const options = recommendDoctors(entries(), DOCTORS, {
      hospitalId: hospital_id,
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

    const payload = {
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
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
