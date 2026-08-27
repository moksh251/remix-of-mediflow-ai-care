import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { doctorSnapshot, doctorsFor } from "../queue-data";

export default defineTool({
  name: "shortest_wait",
  title: "Find shortest waiting times",
  description:
    "Rank Mediflow demo doctors by shortest estimated waiting time, optionally scoped to a hospital or department.",
  inputSchema: {
    hospital_id: z.string().optional().describe("Hospital id such as h1..h5."),
    department: z.string().optional().describe("Department name to scope the ranking."),
    limit: z.number().int().optional().describe("How many doctors to return (default 5)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ hospital_id, department, limit }) => {
    let pool = doctorsFor(hospital_id);
    if (department) {
      const needle = department.trim().toLowerCase();
      pool = pool.filter((d) => d.department.toLowerCase() === needle);
    }
    const count = Math.min(Math.max(limit ?? 5, 1), 20);
    const rows = pool
      .map(doctorSnapshot)
      .sort((a, b) => a.estimated_wait_minutes - b.estimated_wait_minutes)
      .slice(0, count);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { doctors: rows },
    };
  },
});
