# Remix of Mediflow AI Care

You are a senior full-stack engineer, AI engineer, UI/UX designer, healthcare product architect, and hackathon-winning product strategist.

Build a complete, polished, functional web application called:

MEDIFLOW

"Right Care. Right Doctor. Less Waiting."

This is a competitive 24-hour college hackathon project. Our goal is to build a highly polished MVP capable of competing for the ₹40,000 first prize.

IMPORTANT:

Do NOT create a basic hospital website.

Do NOT create only a UI mockup.

Do NOT create a simple appointment-booking website.

Do NOT create disconnected demo screens.

Build a complete interconnected working prototype with realistic demo data, functional navigation, working frontend/backend integration, AI-assisted screening, doctor recommendation, queue estimation, appointment booking, patient token, receptionist dashboard, doctor dashboard, and admin dashboard.

==================================================

CORE IDEA

==================================================

Mediflow helps patients navigate hospital care faster.

The patient enters basic information and symptoms.

The system asks symptom-specific basic screening questions.

It then recommends an appropriate CARE CATEGORY / DEPARTMENT, NOT a medical diagnosis.

After that, it checks the hospital's doctor data:

- specialization

- availability

- current queue

- estimated waiting time

- appointment slots

- consultation duration

It recommends a suitable available doctor and explains why.

The patient can then:

1. Select doctor

2. See queue

3. See estimated waiting time

4. Book appointment

5. Make DEMO payment

6. Receive token

7. Track live queue

Meanwhile the hospital staff can:

- register patients

- generate tokens

- manage queues

- see appointments

- update patient status

- see doctor availability

The admin can:

- monitor hospital operations

- see waiting times

- monitor doctor workload

- see department queues

- analyze patient flow

==================================================

VERY IMPORTANT MEDICAL SAFETY

==================================================

Mediflow is NOT a diagnosis system.

Never say:

"You have gastritis."

"You have pneumonia."

"You have a heart attack."

Instead say:

"Based on the information provided, Gastroenterology may be an appropriate care category."

or:

"Your responses may indicate that urgent medical evaluation is appropriate."

The AI is for:

- basic symptom screening

- care navigation

- department recommendation

- doctor availability comparison

- queue optimization

- appointment assistance

For potentially serious symptoms, do NOT put the user into a normal appointment queue.

Show:

URGENT MEDICAL ATTENTION

"Your responses may indicate a potentially urgent situation. Please seek immediate medical attention or contact the hospital emergency department according to hospital protocol."

Always make it clear that Mediflow does not provide a medical diagnosis.

==================================================

TECH STACK

==================================================

Frontend:

React.js

JavaScript

HTML

CSS

Backend:

Python

FastAPI preferred

Database:

MongoDB

Communication:

REST APIs

AI:

Use an AI API through the backend.

Never expose API keys in frontend code.

Use environment variables.

==================================================

DESIGN

==================================================

Make the website look like a real healthcare technology startup.

Premium.

Modern.

Clean.

Professional.

Fast.

Trustworthy.

Avoid:

- generic Bootstrap appearance

- excessive gradients

- excessive animations

- huge paragraphs

- clutter

- childish colors

- fake AI gimmicks

Use:

- white/light neutral background

- deep navy

- medical blue

- subtle green

- red only for emergency/error states

- rounded cards

- excellent spacing

- strong typography

- subtle shadows

- smooth transitions

- professional icons

- responsive layouts

The patient interface should feel mobile-first.

Hospital dashboards should feel desktop-first.

==================================================

LANDING PAGE

==================================================

Create:

MEDIFLOW

"Right Care. Right Doctor. Less Waiting."

Subtitle:

"AI-assisted hospital navigation, doctor availability and intelligent queue estimation."

Buttons:

FIND MY DOCTOR

BOOK APPOINTMENT

ENTER DEMO

Sections:

Problem

How It Works

Patient Journey

Smart Queue

AI-Assisted Navigation

Hospital Dashboard

Why Mediflow

Future Scope

Keep the copy concise and visual.

==================================================

PATIENT FLOW

==================================================

When the user clicks FIND MY DOCTOR:

STEP 1 — PATIENT DETAILS

Ask:

Full Name

Age

Sex

Height

Weight

Optional phone number

Hospital

Use synthetic demo data.

STEP 2 — MAIN CONCERN

Ask:

"What brings you to the hospital today?"

Display attractive cards:

Fever

Headache

Stomach Pain

Vomiting

Cough / Cold

Breathing Difficulty

Chest Discomfort

Pregnancy-related Concern

Child Health Concern

Joint / Muscle Pain

Skin Problem

Eye Problem

ENT Problem

General Check-up

Other

Allow multiple symptoms.

Allow free-text description.

==================================================

AI SCREENING

==================================================

The AI must NOT ask the same questions for every symptom.

Use symptom-specific screening.

STOMACH PAIN:

Ask:

- How long?

- Where exactly?

- Severity?

- Vomiting?

- Fever?

- Diarrhea?

- Blood in stool/vomit?

- Getting worse?

Possible care categories:

General Physician

Gastroenterologist

HEADACHE:

Ask:

- Since when?

- Severity?

- Fever?

- Vomiting?

- Vision changes?

- Recent head injury?

- Sudden severe onset?

- Weakness/numbness?

- Speech difficulty?

Possible categories:

General Physician

Neurologist

FEVER:

Ask:

- Duration?

- Temperature?

- Chills?

- Cough?

- Vomiting?

- Body pain?

- Breathing difficulty?

- Rash?

Possible category:

General Physician

COUGH / COLD:

Ask:

- Duration?

- Fever?

- Breathing difficulty?

- Chest discomfort?

- Phlegm?

- Blood?

- Severity?

Possible category:

General Physician

PREGNANCY:

Ask:

- Pregnancy stage/week?

- Abdominal pain?

- Bleeding?

- Contractions?

- Fluid leakage?

- Severe headache?

- Vision changes?

- Other concern?

Possible category:

Gynecologist

CHILD HEALTH:

Ask:

- Child's age?

- Fever?

- Temperature?

- Duration?

- Vomiting?

- Breathing difficulty?

- Eating/drinking?

- Unusual sleepiness?

- Rash?

Possible category:

Pediatrician

CHEST DISCOMFORT:

Ask basic safety screening questions.

If configured urgent responses occur:

DO NOT show routine booking first.

Show:

URGENT MEDICAL ATTENTION

==================================================

DOCTOR DATABASE

==================================================

Create at least 10 fictional synthetic doctors.

GENERAL PHYSICIAN / MBBS:

1. Dr. Rajesh Mehta

12 years experience

2. Dr. Amit Shah

8 years experience

GYNECOLOGIST:

3. Dr. Priya Desai

14 years experience

4. Dr. Neha Patel

10 years experience

GASTROENTEROLOGIST:

5. Dr. Suresh Patel

16 years experience

6. Dr. Ashish Joshi

11 years experience

PEDIATRICIAN:

7. Dr. Kavita Mehta

13 years experience

8. Dr. Rohan Shah

7 years experience

NEUROLOGIST:

9. Dr. Anjali Desai

15 years experience

10. Dr. Vivek Shah

18 years experience

These are fictional demo doctors.

Do not imply they are real people.

Each doctor should have:

- name

- specialization

- hospital

- experience

- consultation fee

- average consultation duration

- status

- current queue

- available slots

==================================================

DOCTOR STATUS

==================================================

Possible states:

AVAILABLE

IN CONSULTATION

ON BREAK

OFFLINE

FULLY BOOKED

==================================================

SMART DOCTOR RECOMMENDATION

==================================================

This is one of the most important features.

Do NOT simply recommend the doctor with the shortest queue.

Recommendation priority:

1. Appropriate care category

2. Doctor specialization

3. Availability

4. Urgency/priority

5. Queue

6. Estimated waiting time

7. Appointment availability

Example:

Patient needs Gastroenterology.

Dr. Suresh Patel

Gastroenterologist

Available

3 patients ahead

18 min estimated wait

Dr. Ashish Joshi

Gastroenterologist

Busy

8 patients ahead

55 min estimated wait

Display:

⭐ MEDIFLOW RECOMMENDATION

Dr. Suresh Patel

Gastroenterologist

18 min estimated wait

3 patients ahead

AVAILABLE

Why?

✓ Appropriate specialization

✓ Currently available

✓ Lower estimated waiting time

Buttons:

BOOK WITH DR. SURESH

JOIN QUEUE

VIEW OTHER DOCTORS

==================================================

DOCTOR COMPARISON

==================================================

Show multiple suitable doctors.

Each card:

Doctor name

Specialization

Experience

Availability

Patients ahead

Estimated wait

Consultation fee

Next available slot

Sorting:

Recommended

Shortest Wait

Earliest Appointment

Do not allow shortest waiting time to override suitability.

==================================================

QUEUE ENGINE

==================================================

Build an actual queue calculation system.

Use:

Patients ahead

Average consultation duration

Current doctor status

Appointment schedule

Priority cases

Current consultation state

Estimated waiting time must be calculated, not randomly generated.

Example:

Patients ahead × average consultation duration

plus relevant current consultation/appointment state.

Create independent queue functions:

calculate_wait_time()

add_patient_to_queue()

remove_patient_from_queue()

complete_patient()

get_queue_status()

update_doctor_status()

recalculate_queue()

==================================================

LIVE QUEUE

==================================================

After booking show:

YOUR TOKEN

A-104

Currently serving:

A-101

Patients ahead:

3

Estimated waiting:

18 minutes

Doctor:

Dr. Suresh Patel

Status:

IN CONSULTATION

Queue visualization:

A-101 ✓

A-102 ✓

A-103 → NEXT

A-104 → YOU

A-105

A-106

Show:

"Queue updated 1 minute ago"

Create simulated live updates for the hackathon demo.

Example:

3 patients ahead → 2 patients ahead

18 min → 12 min

==================================================

BOOKING

==================================================

Patient can:

- select doctor

- select slot

- see fee

- see queue

- see estimated wait

- confirm booking

Confirmation:

BOOKING CONFIRMED

Patient:

Priya Shah

Doctor:

Dr. Suresh Patel

Specialization:

Gastroenterologist

Token:

A-104

Appointment:

3:40 PM

Estimated wait:

18 minutes

Booking ID:

MF-2026-1048

Create a beautiful QR-style appointment card.

==================================================

DEMO PAYMENT

==================================================

Create a DEMO payment page.

Consultation fee:

₹500

Payment options:

UPI

Demo Card

Demo Wallet

Button:

PAY & CONFIRM

After success:

PAYMENT SUCCESSFUL ✓

Transaction:

DEMO-TXN-45821

Booking:

MF-2026-1048

Token:

A-104

Clearly mark:

DEMO PAYMENT

Do not integrate real payment credentials.

==================================================

RECEPTIONIST DASHBOARD

==================================================

Create a professional:

HOSPITAL STAFF

LIVE OPERATIONS DASHBOARD

Show:

Today's Patients

Waiting Patients

Active Doctors

Average Wait

Appointments

Priority Alerts

Receptionist can:

REGISTER PATIENT

GENERATE TOKEN

SELECT DOCTOR

MARK ARRIVED

MARK COMPLETED

MARK NO-SHOW

The receptionist should NOT manually calculate waiting time.

Receptionist enters basic patient details and doctor.

The system automatically:

Generates token

Updates queue

Calculates estimated wait

Updates doctor load

Updates patient dashboard

==================================================

ADMIN DASHBOARD

==================================================

Create a premium analytics dashboard.

Cards:

Total Patients Today

Currently Waiting

Average Waiting Time

Active Doctors

Completed Consultations

No-Shows

Charts:

Patient Flow

Waiting Time Trend

Doctor Workload

Department Queue

Peak Hours

Live hospital status:

General Medicine — 32 waiting

Gastroenterology — 7 waiting

Gynecology — 18 waiting

Pediatrics — 9 waiting

Neurology — 5 waiting

==================================================

SMART QUEUE BALANCING

==================================================

Create:

SMART QUEUE BALANCE

Example:

Gastroenterology:

Dr. Ashish:

55 min

Dr. Suresh:

18 min

Show:

"Queue imbalance detected."

"Both doctors are configured for the same care category."

"Eligible patients may be considered for Dr. Suresh according to hospital workflow."

Hospital staff remains in control.

==================================================

DOCTOR DASHBOARD

==================================================

Show:

Doctor profile

Today's appointments

Current patient

Next patient

Current queue

Estimated wait

Patient summary

Actions:

START CONSULTATION

COMPLETE

SKIP / NO-SHOW

PAUSE QUEUE

AI patient summary:

"Patient reports stomach discomfort for approximately 2 days, with vomiting reported. No fever reported."

Clearly label:

"Generated from patient-provided information. Not a diagnosis."

Do not generate treatment recommendations.

==================================================

AI PATIENT SUMMARY

==================================================

After screening create:

PATIENT:

Priya Shah

AGE:

27

PRIMARY CONCERN:

Stomach pain

DURATION:

2 days

ASSOCIATED RESPONSE:

Vomiting

REPORTED:

No fever

NAVIGATION:

Gastroenterology

Disclaimer:

"This summary is generated from patient-provided information and is not a diagnosis."

==================================================

PRIORITY ARRIVAL

==================================================

Create a pregnancy-related example.

If patient has routine concern:

Recommend gynecologist.

If urgent warning signs:

Show urgent medical attention.

If patient books:

Hospital dashboard receives:

PATIENT ARRIVING

Pregnancy-related appointment

ETA:

12 minutes

Status:

Priority review required

Staff actions:

ACKNOWLEDGE

PREPARE

CONTACT PATIENT

Do NOT promise that a doctor will definitely become available.

The system only alerts staff early so appropriate resources can be prepared.

==================================================

MULTI-HOSPITAL

==================================================

Support multiple demo hospitals:

Mediflow City Hospital

CarePoint Hospital

Aarogya Multispeciality

LifeBridge Hospital

Unity Medical Center

Each hospital has independent:

Doctors

Departments

Queues

Appointments

Slots

Fees

Staff

==================================================

AI ASSISTANT

==================================================

Create a floating:

ASK MEDIFLOW

Patients can ask:

"Which doctor should I see?"

"How long will I wait?"

"Who is available now?"

"Can I book Dr. Suresh?"

"What is my token?"

The assistant must ONLY use available system data.

Never invent doctor availability, queue status, prices or appointments.

==================================================

DEMO MODE

==================================================

Create:

ENTER DEMO

Buttons:

PATIENT DEMO

RECEPTIONIST DEMO

DOCTOR DEMO

ADMIN DEMO

Use synthetic data.

No complicated authentication for the judge demo.

==================================================

JUDGE DEMO

==================================================

The complete 3-minute demonstration should work perfectly.

SCENARIO:

Priya, age 27, has stomach pain.

1. Enter patient details.

2. Select Stomach Pain.

3. AI asks relevant screening questions.

4. System recommends Gastroenterology as a care category.

5. Show:

Dr. Suresh Patel

3 patients ahead

18 min

Available

Dr. Ashish Joshi

8 patients ahead

55 min

Busy

6. Mediflow recommends Dr. Suresh.

7. Patient books.

8. Demo payment succeeds.

9. Token A-104 generated.

10. Switch to Receptionist Dashboard.

11. Show new patient.

12. Open live queue.

13. Simulate one consultation completing.

14. Queue changes from 3 → 2.

15. Estimated wait changes from 18 → 12 minutes.

The judge should immediately understand:

PATIENT BENEFIT:

Less uncertainty and less unnecessary waiting.

HOSPITAL BENEFIT:

Better visibility and queue management.

==================================================

SECOND DEMO

==================================================

Child fever.

Parent enters:

Child age: 6

Fever

2 days

AI asks pediatric screening questions.

Result:

Pediatrician

Dr. Kavita Mehta

11 min

Dr. Rohan Shah

24 min

Recommend Dr. Kavita.

==================================================

THIRD DEMO

==================================================

Pregnancy-related concern.

AI asks basic screening questions.

Routine:

Recommend Gynecologist.

Urgent warning signs:

Urgent medical attention.

Hospital staff notification.

==================================================

ERROR STATES

==================================================

Handle:

No doctor available

No slots

Hospital closed

Payment failure

Network failure

Queue unavailable

Incomplete information

Invalid information

Emergency response

Doctor goes offline

Appointment cancelled

Every error must have a useful next step.

==================================================

DATABASE

==================================================

MongoDB collections:

users

patients

hospitals

doctors

departments

appointments

queues

queue_entries

payments

notifications

screening_questions

symptoms

bookings

staff

admin_logs

Use realistic synthetic seed data.

==================================================

SECURITY

==================================================

Use:

Environment variables

Backend validation

Input sanitization

No API keys in frontend

No sensitive information in console logs

Synthetic patient data

==================================================

RESPONSIVENESS

==================================================

Patient:

Mobile-first

Hospital/Admin:

Desktop-first

Support:

Mobile

Tablet

Laptop

Desktop

==================================================

CODE ORGANIZATION

==================================================

Frontend:

src/

components/

pages/

layouts/

services/

hooks/

utils/

data/

assets/

Backend:

app/

routes/

models/

services/

ai/

queue/

utils/

config/

Keep:

AI logic

Recommendation logic

Queue logic

Booking

Payments

Notifications

separate and maintainable.

==================================================

HACKATHON PRIORITY

==================================================

If development time becomes limited:

P0 — MUST WORK:

Patient flow

Symptom screening

Care navigation

Doctor recommendation

Queue calculation

Booking

Token

Receptionist dashboard

Live queue

Admin dashboard

P1:

AI patient summary

Demo payment

Notifications

Doctor dashboard

Queue simulation

P2:

Advanced chatbot

Voice assistant

Advanced analytics

Multi-hospital comparison

DO NOT sacrifice P0 for flashy features.

==================================================

FUTURE SCOPE

==================================================

Show these only as future possibilities:

ABDM integration

EHR integration

Hospital-to-hospital availability

WhatsApp/SMS notifications

Multilingual voice assistant

Predictive hospital demand

Wearable integration

Ambulance coordination

Insurance integration

==================================================

FINAL QUALITY REQUIREMENT

==================================================

This must feel like a serious startup prototype, NOT a college CRUD project.

Before finishing, test the complete workflow:

PATIENT

→ DETAILS

→ SYMPTOMS

→ AI SCREENING

→ CARE NAVIGATION

→ DOCTOR RECOMMENDATION

→ QUEUE

→ BOOKING

→ DEMO PAYMENT

→ TOKEN

→ RECEPTIONIST

→ LIVE QUEUE

→ DOCTOR

→ COMPLETION

→ ADMIN ANALYTICS

Fix:

- broken buttons

- broken routes

- API errors

- console errors

- layout issues

- mobile issues

- missing states

- placeholder text

- inconsistent styling

Use realistic synthetic demo data.

Do not claim simulated data is real hospital data.

Do not claim the AI diagnoses patients.

Do not claim real payment processing.

Do not claim clinical validation.

The final product should be:

POLISHED

FAST

INTELLIGENT

PRACTICAL

SAFE

DEMONSTRABLE

SCALABLE

MEMORABLE

Most importantly:

DO NOT TRY TO WIN BY ADDING 100 FEATURES.

WIN BY MAKING THE CORE MEDIFLOW EXPERIENCE EXCEPTIONALLY GOOD.

BUILD THE COMPLETE MEDIFLOW WEBSITE NOW.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/99764c27-910a-4c41-843b-1340ec7ee59a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
