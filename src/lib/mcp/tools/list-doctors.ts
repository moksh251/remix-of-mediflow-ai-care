import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { doctorSnapshot, doctorsFor } from "../queue-data";

export default defineTool({
  name: "list_doctors",
  title: "List doctors and live queue",
  description:
    "List Mediflow demo doctors with status, consultation fee, patients ahead, estimated wait time and next slot. Optionally filter by hospital or department.",
  inputSchema: {
    hospital_id: z.string().optional().describe("Hospital id such as h1..h5."),
    department: z
      .string()
      .optional()
      .describe("Department name, e.g. General Medicine, Pediatrics, Gynecology, Gastroenterology, Neurology."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ hospital_id, department }) => {
    let pool = doctorsFor(hospital_id);
    if (department) {
      const needle = department.trim().toLowerCase();
      pool = pool.filter((d) => d.department.toLowerCase() === needle);
    }
    const rows = pool.map(doctorSnapshot);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { doctors: rows },
    };
  },
});
