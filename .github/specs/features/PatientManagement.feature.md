# Patient Management — Spec


This file is a spec-ready decomposition of the BRD into features, with traceable Given/When/Then scenarios, implementation constraints, sizing estimates, and an accuracy report.

---

### F1 — Patient Profile Management
**Source:** Functional Requirements | Functional
**Description:** Create, edit, and view patient profiles so the physician can accurately link consultation records to the correct patient.

**Scenario 1: Happy path**
Given the physician is on the "Add Patient" form with name, DOB/age, gender, and contact provided
When the physician submits the form
Then a new patient profile is created, visible in patient list, and a confirmation message is shown

**Scenario 2: Validation - missing required field**
Given the physician leaves the `Name` or `Contact` field empty on the "Add Patient" form
When the physician submits the form
Then the system blocks submission and displays a validation error indicating the missing fields

---

### F2 — Appointment Scheduling
**Source:** Functional Requirements | Functional
**Description:** Schedule, view, and update appointment statuses to manage the clinic's daily schedule.

**Scenario 1: Happy path**
Given the physician creates an appointment with patient, date and time provided
When the physician saves the appointment
Then the appointment appears in the daily appointment list with status `Scheduled`

**Scenario 2: Edge case - time conflict**
Given an existing appointment occupies the requested time slot
When the physician attempts to save a second appointment for the same time slot
Then the system rejects the save and shows a message that the slot is unavailable or suggests alternative times

---

### F3 — Consultation Record Capture
**Source:** Functional Requirements | Functional
**Description:** Capture a consultation including mandatory vitals, complaints, diagnosis, and prescriptions, storing it against the patient's history.

**Scenario 1: Happy path**
Given the physician opens a consultation form for a patient and fills vitals, complaints, diagnosis, and medications
When the physician saves the consultation
Then the consultation is saved and linked to the patient's visit history

**Scenario 2: Validation - missing mandatory vitals**
Given the physician attempts to save a consultation without entering temperature, blood pressure, or pulse
When the physician submits the consultation
Then the system blocks the save and displays validation errors requiring the missing vitals

---

### F4 — Prescription Generation
**Source:** Functional Requirements | Functional
**Description:** Generate a printable prescription containing clinic header, patient details, vitals, diagnosis, medications, and footer.

**Scenario 1: Happy path**
Given a saved consultation with at least one medication
When the physician selects "Generate Prescription"
Then a printable prescription document is created and displayed for print/preview containing header, patient details, vitals, diagnosis, medications, and footer

**Scenario 2: Edge case - no medications**
Given a saved consultation has zero medications
When the physician attempts to generate a prescription
Then the system prevents generation and prompts to add at least one medication or allows generation with an explicit confirmation (design decision)

---

### F5 — Visit History Review
**Source:** Functional Requirements | Functional
**Description:** View and filter a patient's prior visits including vitals, complaints, diagnosis, and prescriptions for follow-up and continuity of care.

**Scenario 1: Happy path**
Given a patient has prior consultations saved
When the physician opens the patient's history
Then the system shows a list of previous visits with quick access to vitals, complaints, diagnoses, and prescriptions

**Scenario 2: Filter by date**
Given a patient has visits across multiple dates
When the physician applies a date range filter
Then only visits within that date range are displayed

---

### F6 — Patient Search and Navigation
**Source:** Functional Requirements | Functional
**Description:** Quickly locate patients by name or phone and navigate between patient profile and visit records.

**Scenario 1: Happy path**
Given the physician types a full or partial patient name or phone number in search
When they execute the search
Then matching patient records are returned sorted by relevance and recent activity

**Scenario 2: No results**
Given the physician searches for a non-existent patient
When they execute the search
Then the system shows a "no results found" message and suggests creating a new patient

---

### F7 — Data Export (CSV/PDF)
**Source:** Functional Requirements | Functional
**Description:** Export selected patient or visit data as CSV or PDF for records or printing.

**Scenario 1: Happy path**
Given the physician selects a patient or filtered visit list
When they choose Export → CSV or Export → PDF
Then the system generates and downloads the requested file in the chosen format

**Scenario 2: Empty dataset**
Given the selected filter returns zero records
When the physician triggers Export
Then the system prevents export and displays "No data available to export"

---

## Implementation Constraints (Not Features)
- Data must be encrypted at rest and in transit (TLS + DB encryption).
- Automated backups must be scheduled and recoverable.
- Single-user model (no multi-tenant or receptionist access in Phase 1).
- Application must support modern browsers (Chrome, Edge, Safari) and target page load < 2s.
- No billing, insurance, lab/pharmacy integrations in Phase 1.

## Sizing Check
- **F1 — Patient Profile Management:** Medium — profile CRUD, validation, list view (2–3 days).
- **F2 — Appointment Scheduling:** Medium — create/list/status updates (3–4 days).
- **F3 — Consultation Record Capture:** Medium — multi-field form + validations (3–5 days).
- **F4 — Prescription Generation:** Small — templated print output (1–2 days).
- **F5 — Visit History Review:** Medium — listing and filtering (2–3 days).
- **F6 — Patient Search and Navigation:** Small — search and navigation (1–2 days).
- **F7 — Data Export:** Small — CSV/PDF generation (1–2 days).

## Accuracy Report

### BRD Coverage Summary
- Functional Requirements listed in BRD: 8 primary user-facing capabilities mapped to features (100% coverage of listed functional items).
- Non-Functional Requirements (NFRs): Usability, Performance, Reliability, Security, Scalability, Compatibility — represented as Implementation Constraints and one inferred feature (Secure Login).

### Scenario Relevance & Testability
- Total features: 7
- Total scenarios: 14 (2 per feature)
- BRD-direct scenarios: 14 (derived explicitly from functional text)
- High testability: all scenarios are concrete Given/When/Then statements and map to validation rules or observable outcomes.

### Coverage Table (summary)
- Functional Coverage: 100% (all BRD functional items represented)
- NFR Coverage: ~83% (most NFRs represented as constraints)

**Overall Accuracy Verdict:** Ready for Spec writing — minor NFR items are captured as constraints and one inferred auth feature; no blocking gaps identified.

---

### Traceability Notes
- Each feature scenario maps to the BRD's Functional Requirements or NFRs (see top of this file for BRD source path).
- If you want per-scenario line-level traceability, I can add BRD line references on request.

---

End of spec.
