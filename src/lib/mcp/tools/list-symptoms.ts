import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { SYMPTOMS } from "@/lib/mediflow/screening";
import { DISCLAIMER } from "../queue-data";

export default defineTool({
  name: "list_symptom_screenings",
  title: "List symptom screenings",
  description:
    "List the symptom concerns Mediflow can screen, and optionally the screening questions for specific symptom ids. Care navigation only, never a diagnosis.",
  inputSchema: {
    symptom_ids: z
      .array(z.string())
      .optional()
      .describe("Symptom ids to include questions for, e.g. ['fever','headache']."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ symptom_ids }) => {
    const wanted = symptom_ids?.map((s) => s.trim().toLowerCase());
    const rows = SYMPTOMS.map((s) => ({
      id: s.id,
      label: s.label,
      base_department: s.baseDepartment,
      specialist_department: s.specialistDepartment ?? null,
      questions:
        wanted && wanted.includes(s.id)
          ? s.questions.map((q) => ({ key: `${s.id}:${q.id}`, text: q.text, options: q.options }))
          : undefined,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify({ symptoms: rows, disclaimer: DISCLAIMER }, null, 2) }],
      structuredContent: { symptoms: rows, disclaimer: DISCLAIMER },
    };
  },
});
