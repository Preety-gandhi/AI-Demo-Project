# Feature Specification: F4 — Prescription Generation

## 1. Description
Allows the physician to generate a printable prescription that includes patient, diagnosis, and medication details.

## 5. Goal
To support the physician in producing a clear, printable prescription for patient treatment that includes all required clinical information.

## 6. Non-Goal
This feature does not include electronic billing, pharmacy integration, medication stock management, or automated refill scheduling.

## 7. Current behaviour
Prescriptions may be handwritten or created in separate tools, which can cause missing information, poor legibility, and inconsistent formatting.

## 8. Expected behaviour
The system should generate a printable prescription with the clinic header, patient details, diagnosis, medications, and footer whenever a valid consultation has been documented.

## 9. Scope
This feature includes prescription document generation after consultation entry and validation that medication details are present.

## 10. Acceptance Criteria
### Scenario 1: Happy path
Given a physician has created a consultation with valid diagnosis and medications
When the prescription is generated
Then a printable prescription is produced with the clinic header, patient details, diagnosis, medications, and footer.

### Scenario 2: Edge case
Given a physician tries to generate a prescription without adding any medication
When the action is triggered
Then the system prevents generation and prompts the user to add at least one medication.


