# Feature Specification: F6 — Patient Search and Navigation

## 1. Description
Helps the physician quickly locate patients and move between patient profiles and visit records.

## 5. Goal
To provide fast, reliable patient search and navigation so the physician can find records and switch between profiles and visits without delay.

## 6. Non-Goal
This feature does not include advanced search analytics, third-party directory lookup, or non-clinical user management.

## 7. Current behaviour
Patient lookup may be slow or rely on manual browsing through lists, which can delay consultations and increase frustration.

## 8. Expected behaviour
The system should allow the physician to search by patient name or phone number and open the matching patient record quickly.

## 9. Scope
This feature includes patient search, no-results handling, and navigation between patient profiles and visit history.

## 10. Acceptance Criteria
### Scenario 1: Happy path
Given a physician enters a patient’s valid name or phone number in the search box
When the search is executed
Then the matching patient record is displayed immediately.

### Scenario 2: No-match case
Given a physician searches for a patient that does not exist
When the search is executed
Then the system shows a clear “no results found” message and does not crash.


