# Feature Specification: F3 — Consultation Record Capture

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
Given a physician is recording a consultation for a patient
When they enter valid vitals, symptoms, diagnosis, and medications
Then the form validates required fields and valid details, and the consultation record is saved and linked to the patient's visit history.

### Scenario 2: Mandatory validation
Given a physician tries to save a consultation without entering the required vitals
When the record is submitted
Then the system prevents saving and prompts for temperature, blood pressure, and pulse.


