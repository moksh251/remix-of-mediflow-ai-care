import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediflow } from "@/lib/mediflow/store";
import { HOSPITALS } from "@/lib/mediflow/data";
import { SYMPTOMS } from "@/lib/mediflow/screening";
import {
  listDoctors,
  shortestWait,
  trackToken,
  navigateCare,
  listHospitals,
} from "@/lib/mediflow/queries";

interface Msg {
  from: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "Who is available now?",
  "Shortest wait?",
  "Stomach pain — which doctor?",
  "Track token A-104",
];

const SYMPTOM_KEYWORDS: Record<string, string> = {
  stomach: "stomach", gastro: "stomach", abdomen: "stomach", belly: "stomach",
  vomit: "vomiting", nausea: "vomiting",
  headache: "headache", migraine: "headache",
  fever: "fever", temperature: "fever",
  cough: "cough", cold: "cough", flu: "cough",
  breathing: "breathing", breathless: "breathing", breath: "breathing",
  chest: "chest",
  pregnan: "pregnancy", gyn: "pregnancy", obstetr: "pregnancy",
  child: "child", pediatric: "child", paediatric: "child", kid: "child",
  joint: "joint", muscle: "joint", knee: "joint",
  skin: "skin", rash: "skin",
  eye: "eye",
  ear: "ent", nose: "ent", throat: "ent", ent: "ent",
  checkup: "checkup", "check-up": "checkup",
};

function matchSymptom(text: string) {
  for (const [key, id] of Object.entries(SYMPTOM_KEYWORDS)) {
    if (text.includes(key)) return SYMPTOMS.find((s) => s.id === id);
  }
  return undefined;
}

function extractToken(q: string): string | undefined {
  const m = q.match(/[A-E]\s?-\s?\d{1,4}/i);
  return m ? m[0].replace(/\s/g, "") : undefined;
}

export function AskMediflow() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: "Hi, I'm Mediflow Assist. I answer only from live hospital demo data — availability, queues, waiting times, fees, symptom navigation and your token. I do not provide medical advice or diagnosis.",
    },
  ]);

  const state = useMediflow((s) => s);
  const hospital = HOSPITALS.find((h) => h.id === state.activeHospitalId);

  function answer(q: string): string {
    const text = q.toLowerCase();
    const { entries, doctors } = state;
    const hospitalId = state.activeHospitalId;

    // Token tracking — routed through the shared trackToken query.
    if (text.includes("token")) {
      const token = extractToken(q) ?? state.bookings[state.bookings.length - 1]?.token;
      if (token) {
        const t = trackToken(entries, doctors, token);
        if (t) {
          const pos = t.position_in_queue ? `position ${t.position_in_queue}` : "not currently waiting";
          return `Token ${t.token}: ${t.patient_name}, ${t.concern}. With ${t.doctor}${t.department ? ` (${t.department})` : ""}. Status ${t.status}, ${pos}, ${t.patients_ahead} ahead, ~${t.estimated_wait_minutes} min wait.`;
        }
        return `No token ${token} found in the current live queue.`;
      }
      return "I don't see a booking in this session yet. Complete a booking through Find My Doctor and your token will appear here.";
    }

    // Named doctor — from the shared listDoctors snapshot.
    const named = doctors.find((d) => text.includes(d.name.toLowerCase().replace("dr. ", "")));
    if (named) {
      const snap = listDoctors(entries, doctors, { hospitalId }).find((s) => s.id === named.id);
      if (snap) {
        return `${snap.name} (${snap.specialization}) is ${snap.status}. ${snap.patients_ahead} patient(s) waiting, estimated wait ${snap.estimated_wait_minutes} min. Consultation fee ₹${snap.consultation_fee_inr}. Next slot ${snap.next_slot}.`;
      }
    }

    // Availability.
    if (text.includes("available") || text.includes("who is") || text.includes("who's") || text.includes("free")) {
      const rows = listDoctors(entries, doctors, { hospitalId }).filter((s) => s.status === "AVAILABLE");
      return rows.length
        ? `Available now at ${hospital?.name}: ${rows.map((s) => `${s.name} (${s.specialization})`).join("; ")}.`
        : "No doctor is marked AVAILABLE right now. Doctors in consultation are still accepting queue entries.";
    }

    // Shortest wait — routed through shortestWait.
    if (text.includes("wait") || text.includes("queue") || text.includes("shortest") || text.includes("fastest")) {
      const rows = shortestWait(entries, doctors, { hospitalId, limit: 3 });
      return `Shortest estimated waits right now: ${rows.map((s) => `${s.name} — ${s.estimated_wait_minutes} min (${s.patients_ahead} ahead)`).join("; ")}.`;
    }

    // Fees.
    if (text.includes("fee") || text.includes("price") || text.includes("cost") || text.includes("charge")) {
      const rows = listDoctors(entries, doctors, { hospitalId });
      return `Consultation fees at ${hospital?.name}: ${rows.map((s) => `${s.name} ₹${s.consultation_fee_inr}`).join(", ")}.`;
    }

    // Symptom navigation — routed through navigateCare (screening + recommendation engine).
    const symptom = matchSymptom(text);
    if (symptom) {
      const result = navigateCare(entries, doctors, { hospitalId, symptomIds: [symptom.id] });
      let msg = `${result.care_category} may be an appropriate care category for that concern. `;
      if (result.urgent) {
        msg += `⚠️ Emergency signs were reported (${result.reasons.join(", ")}). Please seek immediate medical attention. `;
      }
      const opts = result.recommended_doctors.slice(0, 3);
      msg += opts.length
        ? `Options: ${opts.map((d) => `${d.name} — ${d.estimated_wait_minutes} min, ${d.patients_ahead} ahead, ₹${d.consultation_fee_inr}`).join("; ")}. `
        : "No matching doctor is configured at this hospital right now. ";
      msg += "Mediflow does not provide a diagnosis.";
      return msg;
    }

    // Hospital list.
    if (text.includes("hospital") || text.includes("branch") || text.includes("location")) {
      const rows = listHospitals(entries, doctors);
      return `Hospitals in the demo network: ${rows.map((h) => `${h.name} (${h.city}) — ${h.open_now ? "open" : "closed"}`).join("; ")}.`;
    }

    if (text.includes("book") || text.includes("appointment")) {
      return "You can book from the doctor comparison screen in Find My Doctor. Select a doctor, pick a slot, complete the demo payment and you'll receive a token.";
    }

    return "I can answer about doctor availability, queue length, estimated waiting time, consultation fees, symptom-based navigation and your token. Try “shortest wait”, “who is available”, or “stomach pain”.";
  }

  function send(q: string) {
    const text = q.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }, { from: "bot", text: answer(text) }]);
    setValue("");
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground shadow-lift transition hover:opacity-90"
        >
          <MessageCircle className="size-4" /> Ask Mediflow
        </button>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-navy-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <div>
                <p className="text-sm font-semibold">Ask Mediflow</p>
                <p className="text-[11px] opacity-70">Answers from live demo data only</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.from === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-foreground"
                }
              >
                {m.text}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(value);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask about doctors, queue or token"
              maxLength={200}
            />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
