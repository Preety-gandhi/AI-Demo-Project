# Feature Specification: F4 — Prescription Generation

## Source
**Reference:** features/PatientManagement.feature.md | F4 — Prescription Generation

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
Given a saved consultation with at least one medication
When the physician selects "Generate Prescription"
Then a printable prescription document is created and displayed for print/preview containing header, patient details, vitals, diagnosis, medications, and footer

### Scenario 2: Edge case - no medications
Given a saved consultation has zero medications
When the physician attempts to generate a prescription
Then the system prevents generation and prompts to add at least one medication or allows generation with an explicit confirmation (design decision)

## Implementation Order
**Phase 4 — Prescription & History Features (Step 4)**
- **Prerequisites:** F3 (Consultation Record Capture) ✓
- **Status:** Implement After F3
- **Parallel Implementation:** Can be developed in parallel with F5
- **Reasoning:** Requires consultation data to generate prescriptions. Small scope, can be completed quickly after F3.
- **Est. Duration:** 1–2 days

## Dependencies
F3 (Consultation Record Capture)
