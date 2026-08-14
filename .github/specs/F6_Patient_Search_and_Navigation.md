# Feature Specification: F6 — Patient Search and Navigation

## Source
**Reference:** features/PatientManagement.feature.md | F6 — Patient Search and Navigation

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
Given the physician types a full or partial patient name or phone number in search
When they execute the search
Then matching patient records are returned sorted by relevance and recent activity

### Scenario 2: No results
Given the physician searches for a non-existent patient
When they execute the search
Then the system shows a "no results found" message and suggests creating a new patient

## Implementation Order
**Phase 2 — Core Features (Step 2)**
- **Prerequisites:** F1 (Patient Profile Management) ✓
- **Status:** Implement After F1
- **Parallel Implementation:** Can be developed in parallel with F2
- **Reasoning:** Requires patient profiles for search functionality. Improves user experience for accessing patient data.
- **Est. Duration:** 1–2 days

## Dependencies
F1 (Patient Profile Management)
