# Spec: .github/specs/PatientManagement.spec.md

## Goal

Enable a general physician to manage patient registration, appointments, consultations, prescriptions, and visit history through a simple web-based Patient Management Application.

## Scope

Files: .github/specs/PatientManagement.spec.md
Services: Web browser UI, backend API, database, export service for CSV/PDF
Branch: specs/patient-management-spec

## Non-Goals

- Receptionist or multi-user access
- Billing and invoicing
- Insurance processing
- Lab or pharmacy integration
- AI diagnosis or recommendations
- Offline application support
- Mobile native application
- Advanced reporting and analytics
- Multi-doctor or multi-clinic support
- Follow-up reminders or alerts

## Current Behaviour

No digital Patient Management Application exists in this repository. Patient information, appointment scheduling, consultation notes, prescriptions, and patient history are managed manually or with disconnected tools.

## Expected Behaviour

A lightweight web application allows the physician to:

- create, edit, and view patient profiles with name, DOB/age, gender, and contact details
- search patients by name or phone number
- schedule and manage daily appointments with status tracking
- capture consultations with mandatory vitals, complaints, diagnosis, and medication details
- generate printable prescriptions containing clinic header, patient details, vitals, diagnosis, medications, and footer
- view and filter a patients visit history including vitals, complaints, diagnoses, and prescriptions
- export selected patient or visit data as CSV or PDF
- authenticate with a secure single-user login

## Acceptance Criteria

[ ] AC-1: The physician can add, edit, and view patient profiles with required demographics and contact fields.

[ ] AC-2: The application supports patient search by full or partial name and phone number and returns relevant results.

[ ] AC-3: The physician can schedule appointments, view a daily appointment list, and update appointment status to Scheduled, Completed, Cancelled, or No-show.

[ ] AC-4: The consultation form requires temperature, blood pressure, and pulse before allowing save, and stores complaints, diagnosis, and medications.

[ ] AC-5: The physician can generate a printable prescription only after a consultation has at least one medication, and the prescription includes the required header, patient details, vitals, diagnosis, medications, and footer.

[ ] AC-6: The physician can view a patients prior visits and filter visit history by date range.

[ ] AC-7: The physician can export selected patient or visit data to CSV and PDF formats, and the system prevents export when no data is selected.

[ ] AC-8: The application requires secure login for the physician and denies access when credentials are invalid.

## Open Questions

- Q1: Should the export feature include both patient-level and visit-level CSV/PDF options in the first release?
- Q2: Should prescription generation allow explicit confirmation when no medications are listed, or should it block generation entirely?

## Acceptance Criteria Qualities
- **Binary** — it either passes or fails; e.g., "LCP < 2.5 s on 4G measured by Lighthouse" is binary.
- **Testable** — verifiable by an automated test or a manual check without interpretation.
- **Scoped** — applies only to the functionality in scope, not to unrelated components.
- **Specific** — names the exact component, endpoint, or behaviour being tested.
- **Independent** — each criterion can be validated on its own without requiring another AC to be true.
