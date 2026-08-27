# Mediflow review — what's strong, what to fix

I walked every page (landing, patient flow, reception, doctor console, admin, demo room) on desktop and mobile, and checked the browser console.

## What already works well

- Clear, confident landing page: strong hero, "care navigation, not diagnosis" positioning, live queue preview, honest explanation of the wait formula.
- Consistent visual language across all five dashboards — navy/blue medical palette, cards, status pills, readable typography.
- Every role reads the same live queue state, so a reception or doctor action updates the other views instantly.
- Safety framing is present everywhere: disclaimers on the patient flow, doctor console and admin page.
- No console errors on any page. All page titles and meta descriptions are unique and descriptive.

## Issues found

1. **Reception and Admin overflow horizontally on phones.** At a 390px-wide viewport the page content is 698px (Reception) and 618px (Admin) wide, so the user has to scroll sideways. The doctor-queue grid, the waiting-list table and the charts need mobile stacking / horizontal-scroll containers.
2. **No mobile navigation.** The header's Reception / Doctor / Admin links are hidden below the medium breakpoint, and there is no menu replacing them — on a phone only "Find my doctor" is reachable.
3. **Dead metrics on first load.** Admin shows "Revenue (demo) ₹0" and Reception shows "Appointments 0" until someone completes a booking in that session, which reads as broken during a 3-minute demo. Seed a small number of completed bookings so these tiles start with believable values.
4. **Step labels stop at 5 of 5.** The patient journey has eight stages, but booking, payment and token screens are unlabelled after "Step 5 of 5", so the progress cue disappears exactly where the user is deciding to pay.
5. **Doctor console summaries are thin.** For seeded patients the AI summary is just "Patient reports headache. Details collected at reception." The screening engine already produces reported answers, urgency and emergency signs — the console should show urgency, red flags and the answer list for patients who came through the app.
6. **Ask Mediflow is keyword-matching only.** It answers from local string matching, while the app now exposes real MCP tools with the same data. Worth routing it through the shared tool layer so answers stay correct as data changes.
7. **Landing page gaps.** No trust/for-hospitals section, no contact or "book a walkthrough" endpoint, and the footer is minimal — thin for a judged product page.

## Suggested fix order

**Round 1 — demo-critical polish**
- Mobile responsiveness for Reception and Admin (stacked cards, scrollable tables, chart containers).
- Mobile menu in the header covering all four roles plus the demo room.
- Seed completed bookings + revenue so no dashboard tile starts at zero.
- Step labels through step 8 in the patient journey.

**Round 2 — depth**
- Richer doctor-console screening cards (urgency badge, emergency signs, full answer list).
- Ask Mediflow backed by the shared queue/navigation tool layer instead of keyword matching.
- Landing page: "for hospitals" section, footer with contact and safety statement.

## Technical notes

Fixes are frontend-only and stay inside `src/routes/*.tsx`, `src/components/mediflow/Shell.tsx` and `src/lib/mediflow/data.ts` (seed). The queue, screening and recommendation engines are unchanged; the assistant rework would reuse the existing `src/lib/mcp/*` tool functions rather than duplicating logic.

Tell me which rounds you want and I'll implement them.
