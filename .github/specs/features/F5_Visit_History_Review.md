# Feature Specification: F5 — Visit History Review

## 1. Description
Lets the physician review prior visits and retrieve the associated clinical details for follow-up care.

## 5. Goal
To make it easy for the physician to access a patient’s past consultation records and clinical details when planning follow-up care.

## 6. Non-Goal
This feature does not include analytics, billing history, insurance claims, or multi-provider care coordination.

## 7. Current behaviour
Patient visit history may be stored in separate notes or systems, making it difficult to review prior details and follow up consistently.

## 8. Expected behaviour
The system should display past visits with related vitals, complaints, diagnosis, and prescriptions when the physician opens the patient history view.

## 9. Scope
This feature includes viewing historical consultation records for a patient and filtering those visits by date range.

## 10. Acceptance Criteria
### Scenario 1: Happy path
Given a patient has previous consultation records
When the physician opens the patient history view
Then the system displays the past visits with the related vitals, complaints, diagnosis, and prescriptions.

### Scenario 2: Filtered view
Given a physician wants to review visits from a specific date range
When they apply a valid date filter
Then the history view shows only the visits that match the selected dates.


