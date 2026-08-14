# Feature Specification: F3 — Consultation Record Capture

## Source
**Reference:** features/PatientManagement.feature.md | F3 — Consultation Record Capture

## 1. Description
Lets the physician capture all consultation details in one place, including vitals, complaints, diagnosis, and medications.

## 5. Goal
To provide the physician with a complete consultation record workflow so every patient visit is documented and linked to the patient profile.

## 6. Non-Goal
This feature does not include billing, insurance processing, appointment scheduling, prescription printing, or analytics beyond visit documentation.

## 7. Current behaviour
Consultation details may be recorded across multiple notes or systems, which can lead to incomplete records, missing vitals, and difficulty reviewing past consultations.

## 8. Expected behaviour
The system should allow the physician to capture vitals, complaints, diagnosis, and medications in a single consultation record and save it against the patient's visit history.

## 9. Scope
This feature includes capturing consultation details for a patient visit and linking the saved consultation record to the patient's history.

## 10. Acceptance Criteria
### Scenario 1: Happy path
Given the physician opens a consultation form for a patient and fills vitals, complaints, diagnosis, and medications
When the physician saves the consultation
Then the consultation is saved and linked to the patient's visit history

### Scenario 2: Validation - missing mandatory vitals
Given the physician attempts to save a consultation without entering temperature, blood pressure, or pulse
When the physician submits the consultation
Then the system blocks the save and displays validation errors requiring the missing vitals

## Implementation Order
**Phase 3 — Consultation Management (Step 3)**
- **Prerequisites:** F1 (Patient Profile Management) ✓, F2 (Appointment Scheduling) ✓
- **Status:** Implement After F1 and F2
- **Reasoning:** Requires both patient profiles and appointment scheduling to capture consultations. F4 and F5 depend on this.
- **Est. Duration:** 3–5 days

## Dependencies
F1 (Patient Profile Management), F2 (Appointment Scheduling)
