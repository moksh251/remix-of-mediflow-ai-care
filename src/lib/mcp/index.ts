import { defineMcp } from "@lovable.dev/mcp-js";
import type { McpDefinitionInput } from "@lovable.dev/mcp-js";

import listDoctors from "./tools/list-doctors";
import listHospitals from "./tools/list-hospitals";
import listSymptoms from "./tools/list-symptoms";
import navigateCare from "./tools/navigate-care";
import shortestWait from "./tools/shortest-wait";
import trackToken from "./tools/track-token";

export default defineMcp({
  name: "mediflow-ai-care",
  title: "Mediflow AI Care",
  version: "0.1.0",
  instructions:
    "Tools for Mediflow, a hospital care-navigation and smart-queue demo. Use `list_hospitals` and `list_doctors` for availability, fees and live queue load, `shortest_wait` to find the fastest option, `list_symptom_screenings` plus `navigate_care` to map reported symptoms to the right department and doctors, and `track_token` to check a queue token. All data is synthetic demo data. Never present results as a medical diagnosis, medicine or treatment advice; escalate reported emergency signs to immediate in-person medical attention.",
  tools: [
    listHospitals,
    listDoctors,
    shortestWait,
    listSymptoms,
    navigateCare,
    trackToken,
  ] as unknown as McpDefinitionInput["tools"],
});
