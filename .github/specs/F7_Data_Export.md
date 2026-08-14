# Feature Specification: F7 — Data Export (CSV/PDF)

## Source
**Reference:** features/PatientManagement.feature.md | F7 — Data Export

## 1. Description
Allows the physician to export patient or visit data for sharing or recordkeeping.

## 5. Goal
To enable the physician to download patient or visit data in standard formats for reporting and recordkeeping.

## 6. Non-Goal
This feature does not include automated reporting workflows, direct email delivery, or large-scale data warehousing.

## 7. Current behaviour
Data export may not be available or may require manual copying from the application, making it hard to share records reliably.

## 8. Expected behaviour
The system should generate and download the requested CSV or PDF file when the physician selects a patient or visit dataset.

## 9. Scope
This feature includes exporting patient or visit records to CSV and PDF, and handling cases where no data is available.

## 10. Acceptance Criteria
### Scenario 1: Happy path
Given the physician selects a patient or filtered visit list
When they choose Export → CSV or Export → PDF
Then the system generates and downloads the requested file in the chosen format

### Scenario 2: Empty dataset
Given the selected filter returns zero records
When the physician triggers Export
Then the system prevents export and displays "No data available to export"

## Implementation Order
**Phase 5 — Advanced Features (Step 5)**
- **Prerequisites:** F1 (Patient Profile Management) ✓, F5 (Visit History Review) ✓
- **Status:** Implement After F5
- **Reasoning:** Requires patient profiles and visit history to export data. Final feature enhancing data accessibility.
- **Est. Duration:** 1–2 days

## Dependencies
F1 (Patient Profile Management), F5 (Visit History Review)
