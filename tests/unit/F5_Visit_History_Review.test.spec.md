# Test Specification: F5 - Visit History Review
**Source Spec:** specs/F5_Visit_History_Review.md

## Coverage
- AC1: Show past visits with key clinical details
- AC2: Filter visit history by date range

## AC1 Tests

### test_AC1_show_prior_visits_with_quick_clinical_details
Given patient has prior consultations
When physician opens patient history
Then system shows visits with quick access to vitals, complaints, diagnoses, and prescriptions

Mocks/Fixtures:
- Mock consultation repository with multiple visits
- Mock history list renderer
- Fixture with expected quick-detail fields

Binary/Independent:
- PASS if all listed visits include required quick details
- Independent fixture list

### test_AC1_sort_visits_by_most_recent_first
Given patient has visits across multiple dates
When history loads
Then visits are ordered by most recent date first

Mocks/Fixtures:
- Unsorted visit fixtures
- Mock sort function

Binary/Independent:
- PASS if order is descending by date
- Independent deterministic data

### test_AC1_open_visit_detail_from_history
Given history list is visible
When physician selects one visit
Then detailed record for that visit opens with full clinical fields

Mocks/Fixtures:
- Mock navigation/detail panel
- Fixture full visit payload

Binary/Independent:
- PASS if selected visit details match record
- Independent selection fixture

## AC2 Tests

### test_AC2_filter_visits_within_date_range
Given visits exist across several dates
When physician applies start and end date filter
Then only visits within inclusive range are displayed

Mocks/Fixtures:
- Visits across multiple months
- Mock date-range filter logic

Binary/Independent:
- PASS if all results fall in range and out-of-range visits are excluded
- Independent filter fixture

### test_AC2_show_empty_state_for_no_matches
Given no visits match selected date range
When filter is applied
Then system shows no-results message for selected range

Mocks/Fixtures:
- Mock empty-state component
- Fixture date range with no matches

Binary/Independent:
- PASS if empty-state message shown and list empty
- Independent no-match fixture

### test_AC2_reject_invalid_date_range
Given end date is before start date
When physician applies filter
Then system blocks filter and shows invalid-range message

Mocks/Fixtures:
- Mock date validator
- Invalid range fixture

Binary/Independent:
- PASS if filter not applied and error shown
- Independent validator fixture

## Additional Validation Tests

### test_AC1_handle_patient_with_no_history
Given patient has zero consultations
When physician opens history
Then system shows no-history guidance message

### test_AC1_show_prescription_link_when_available
Given visit has associated prescription
When visit row is rendered
Then View Prescription action is visible

## Notes
- Given/When/Then only.
- Tests are binary and independent.
