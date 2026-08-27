import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediflow } from "@/lib/mediflow/store";
import { calculateWaitTime, getQueueStatus } from "@/lib/mediflow/queue";
import { HOSPITALS } from "@/lib/mediflow/data";

interface Msg {
  from: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "Who is available now?",
  "How long will I wait?",
  "Which doctor should I see for stomach pain?",
  "What is my token?",
];

export function AskMediflow() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: "Hi, I'm Mediflow Assist. I answer only from live hospital demo data — availability, queues, waiting times, fees and your token. I do not provide medical advice or diagnosis.",
    },
  ]);

  const state = useMediflow((s) => s);
  const hospital = HOSPITALS.find((h) => h.id === state.activeHospitalId);
  const doctors = state.doctors.filter((d) => d.hospitalId === state.activeHospitalId);

  function answer(q: string): string {
    const text = q.toLowerCase();
    const named = doctors.find((d) => text.includes(d.name.toLowerCase().replace("dr. ", "")));

    if (text.includes("token")) {
      const last = state.bookings[state.bookings.length - 1];
      return last
        ? `Your latest token is ${last.token} with ${doctors.find((d) => d.id === last.doctorId)?.name ?? "your doctor"} (booking ${last.bookingId}).`
        : "I don't see a booking in this session yet. Complete a booking through Find My Doctor and your token will appear here.";
    }
    if (named) {
      const { minutes, ahead } = calculateWaitTime(state.entries, named);
      return `${named.name} (${named.specialization}) is ${named.status}. ${ahead} patient(s) waiting, estimated wait ${minutes} min. Consultation fee ₹${named.fee}. Next slot ${named.slots[0] ?? "not available today"}.`;
    }
    if (text.includes("available") || text.includes("who is")) {
      const free = doctors.filter((d) => d.status === "AVAILABLE");
      return free.length
        ? `Available now at ${hospital?.name}: ${free.map((d) => `${d.name} (${d.specialization})`).join("; ")}.`
        : "No doctor is marked AVAILABLE right now. Doctors in consultation are still accepting queue entries.";
    }
    if (text.includes("wait") || text.includes("queue")) {
      const sorted = doctors
        .map((d) => ({ d, w: calculateWaitTime(state.entries, d) }))
        .sort((a, b) => a.w.minutes - b.w.minutes)
        .slice(0, 3);
      return `Shortest estimated waits right now: ${sorted.map(({ d, w }) => `${d.name} — ${w.minutes} min (${w.ahead} ahead)`).join("; ")}.`;
    }
    if (text.includes("fee") || text.includes("price") || text.includes("cost")) {
      return `Consultation fees at ${hospital?.name}: ${doctors.map((d) => `${d.name} ₹${d.fee}`).join(", ")}.`;
    }
    if (text.includes("book")) {
      return "You can book from the doctor comparison screen in Find My Doctor. Select a doctor, pick a slot, complete the demo payment and you'll receive a token.";
    }
    if (text.includes("stomach") || text.includes("gastro")) {
      return departmentAnswer("Gastroenterology");
    }
    if (text.includes("child") || text.includes("pediat")) return departmentAnswer("Pediatrics");
    if (text.includes("pregnan") || text.includes("gyn")) return departmentAnswer("Gynecology");
    if (text.includes("headache") || text.includes("neuro")) return departmentAnswer("Neurology");
    if (text.includes("fever") || text.includes("cough")) return departmentAnswer("General Medicine");

    return "I can answer questions about doctor availability, queue length, estimated waiting time, consultation fees and your token. For symptom-based navigation, please use Find My Doctor.";
  }

  function departmentAnswer(department: string) {
    const pool = doctors.filter((d) => d.department === department);
    if (!pool.length) return `No ${department} doctor is configured at ${hospital?.name} in this demo.`;
    const rows = pool.map((d) => {
      const { minutes } = calculateWaitTime(state.entries, d);
      const { waiting } = getQueueStatus(state.entries, d.id);
      return `${d.name} — ${d.status}, ${waiting.length} ahead, ~${minutes} min`;
    });
    return `${department} may be an appropriate care category for that concern. Current options: ${rows.join("; ")}. Mediflow does not provide a diagnosis.`;
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