import { defineTool } from "@lovable.dev/mcp-js";

import { hospitalLoad, hospitals } from "../queue-data";

export default defineTool({
  name: "list_hospitals",
  title: "List hospitals",
  description:
    "List every hospital in the Mediflow demo network with city, opening hours and current department queue load.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const rows = hospitals().map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      open_hours: h.openHours,
      open_now: h.open,
      department_load: hospitalLoad(h.id),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { hospitals: rows },
    };
  },
});
