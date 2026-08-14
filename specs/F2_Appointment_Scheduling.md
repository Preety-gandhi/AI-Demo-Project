# Feature Specification: F2 — Appointment Scheduling

## Source
**Reference:** features/PatientManagement.feature.md | F2 — Appointment Scheduling

## 1. Description
Enables the physician to schedule, review, and update appointments for daily clinic workflow, ensuring that patient visits are organized and tracked accurately.

## 5. Goal
To provide the physician with a reliable appointment scheduling workflow that supports creating, viewing, and updating daily clinic appointments.

## 6. Non-Goal
This feature does not include receptionist workflows, billing or insurance processing, multi-doctor calendar coordination, reminder notifications, or advanced scheduling analytics.

## 7. Current behaviour
Appointments may currently be managed manually through paper logs or fragmented notes, which can cause double-booking, missed visits, and uncertainty in the daily clinic workflow.

## 8. Expected behaviour
The system should allow the physician to create appointments with a patient, date, and time, display the daily schedule, and prevent conflicting bookings while enabling updates to appointment details.

## 9. Scope
This feature includes appointment creation, appointment review in the daily schedule, and appointment updates for the physician during normal clinic operations.

## 10. Acceptance Criteria
### Scenario 1: Happy path
Given the physician creates an appointment with patient, date and time provided
When the physician saves the appointment
Then the appointment appears in the daily appointment list with status `Scheduled`

### Scenario 2: Edge case - time conflict
Given an existing appointment occupies the requested time slot
When the physician attempts to save a second appointment for the same time slot
Then the system rejects the save and shows a message that the slot is unavailable or suggests alternative times

## Implementation Order
**Phase 2 — Core Features (Step 2)**
- **Prerequisites:** F1 (Patient Profile Management) ✓
- **Status:** Implement After F1
- **Parallel Implementation:** Can be developed in parallel with F6
- **Reasoning:** Requires F1 for patient selection. F3 depends on this feature, so prioritize before F3.
- **Est. Duration:** 3–4 days

## Dependencies
F1 (Patient Profile Management)
