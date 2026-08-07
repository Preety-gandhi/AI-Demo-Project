# Feature Specification: F2 — Appointment Scheduling

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
Given a physician enters a valid appointment date, time, and patient
When the appointment is saved
Then the form validates required fields and valid details, and the appointment is added to the daily schedule with the default status of Scheduled.

### Scenario 2: Edge case
Given a physician tries to create an appointment for a time slot that is already booked
When the appointment is submitted
Then the system rejects the save and informs the user that the slot is unavailable.


