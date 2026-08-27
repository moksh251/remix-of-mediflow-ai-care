import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { DOCTORS } from "@/lib/mediflow/data";
import { calculateWaitTime, getQueueStatus } from "@/lib/mediflow/queue";
import { DISCLAIMER, entries } from "../queue-data";

export default defineTool({
  name: "track_token",
  title: "Track a queue token",
  description:
    "Look up a Mediflow demo queue token (e.g. A-104) and return its doctor, queue position, status and estimated wait time.",
  inputSchema: { token: z.string().describe("Queue token such as A-104.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ token }) => {
    const list = entries();
    const needle = token.trim().toUpperCase();
    const entry = list.find((e) => e.token.toUpperCase() === needle);
    if (!entry) {
      return {
        content: [{ type: "text", text: `No token ${needle} found in the current demo queue.` }],
        isError: true,
      };
    }
    const doctor = DOCTORS.find((d) => d.id === entry.doctorId);
    const { waiting } = getQueueStatus(list, entry.doctorId);
    const position = waiting.findIndex((e) => e.id === entry.id);
    const wait = doctor ? calculateWaitTime(list, doctor, entry.id) : { minutes: 0, ahead: 0 };
    const payload = {
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
      disclaimer: DISCLAIMER,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
