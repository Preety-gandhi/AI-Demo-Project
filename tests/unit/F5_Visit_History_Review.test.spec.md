# Test Cases from Acceptance Criteria: F5 - Visit History Review
Source Spec: specs/F5_Visit_History_Review.md

## AC1 - Scenario 1: Happy path
Given a patient has prior consultations saved
When the physician opens the patient's history
Then the system shows a list of previous visits with quick access to vitals, complaints, diagnoses, and prescriptions

### test_AC1_history_list_shows_prior_visits_with_clinical_details
Given a patient fixture has multiple prior consultations with vitals, complaints, diagnosis, and prescriptions
When the physician opens the patient's history view
Then the visit list displays each visit with quick access to vitals, complaints, diagnosis, and prescription

Mocks/Fixtures:
- Consultation repository mock returning multiple saved visits for the patient
- Patient repository mock returning the patient profile
- Fixture: expected quick-detail fields per visit (vitals, complaints, diagnosis, prescription)

Binary/Independent Verification:
- Pass if and only if every listed visit includes vitals, complaints, diagnosis, and prescription access
- Fails if any visit is missing a required quick-detail field or is omitted from the list
- Independent because it uses isolated repository mocks and fixture data only

### test_AC1_history_visits_ordered_most_recent_first
Given a patient fixture has visits recorded on different dates in non-chronological insertion order
When the physician opens the patient's history view
Then visits are displayed ordered by most recent visit date first

Mocks/Fixtures:
- Consultation repository mock returning visits in unsorted order
- Fixture: expected chronological (descending) order of visit IDs

Binary/Independent Verification:
- Pass if and only if the rendered visit order exactly matches the expected descending-date order
- Fails on any out-of-order visit entry
- Independent because ordering is deterministic from fixture timestamps

### test_AC1_open_visit_detail_shows_full_clinical_record
Given the history list is displayed with at least one visit entry
When the physician selects a specific visit from the list
Then the detailed record for that visit opens showing full clinical fields matching the saved consultation

Mocks/Fixtures:
- Consultation repository mock returning a specific visit's full record
- Mock detail view/navigation handler
- Fixture: full expected visit payload for comparison

Binary/Independent Verification:
- Pass if and only if the opened detail record fields match the fixture exactly
- Fails if any field is missing, incorrect, or the detail view does not open
- Independent because the selected visit and its data are fully mocked

### test_AC1_history_view_shows_guidance_when_patient_has_no_visits
Given a patient fixture has zero saved consultations
When the physician opens the patient's history view
Then the system shows a no-history guidance message instead of a visit list

Mocks/Fixtures:
- Consultation repository mock returning an empty result set for the patient
- Mock empty-state/guidance message component

Binary/Independent Verification:
- Pass if and only if the guidance message is shown and no visit rows are rendered
- Fails if a visit list is rendered or no message is shown
- Independent because it is isolated to a single empty-fixture scenario

## AC2 - Scenario 2: Filter by date
Given a patient has visits across multiple dates
When the physician applies a date range filter
Then only visits within that date range are displayed

### test_AC2_date_range_filter_returns_only_visits_within_inclusive_range
Given a patient fixture has visits spanning several months
When the physician applies a start and end date filter
Then only visits with dates within the inclusive range are displayed and all others are excluded

Mocks/Fixtures:
- Consultation repository mock returning visits across multiple dates
- Mock date-range filter function
- Fixture: expected visit subset for a given start/end date pair

Binary/Independent Verification:
- Pass if and only if the displayed visits exactly match the expected in-range subset
- Fails if any out-of-range visit is included or any in-range visit is excluded
- Independent because the filter fixture and dataset are fully self-contained

### test_AC2_date_range_filter_shows_empty_state_when_no_visits_match
Given a patient fixture has visits that all fall outside a selected date range
When the physician applies that date range filter
Then the system shows a no-results message and displays no visit rows

Mocks/Fixtures:
- Consultation repository mock returning visits outside the selected range
- Mock empty-state/no-results component
- Fixture: date range guaranteed to produce zero matches

Binary/Independent Verification:
- Pass if and only if the no-results message is shown and the visit list is empty
- Fails if any visit row is rendered or no message is shown
- Independent because the fixture date range is fixed to produce no matches

### test_AC2_date_range_filter_rejects_end_date_before_start_date
Given the physician selects an end date that is earlier than the start date
When the physician applies the date range filter
Then the system blocks the filter action and displays an invalid-date-range message

Mocks/Fixtures:
- Mock date-range validator
- Fixture: invalid range pair (end date earlier than start date)
- Mock error presenter

Binary/Independent Verification:
- Pass if and only if the filter is not applied and the invalid-range message is shown
- Fails if the filter proceeds or no validation message is displayed
- Independent because the invalid range fixture is fixed and self-contained

### test_AC2_clearing_date_filter_restores_full_visit_history
Given a date range filter has been applied and reduced the visible visit list
When the physician clears the date filter
Then the full unfiltered visit history is displayed again

Mocks/Fixtures:
- Consultation repository mock returning the full unfiltered visit set
- Mock filter-clear action handler
- Fixture: full visit list for comparison after clearing

Binary/Independent Verification:
- Pass if and only if the displayed list after clearing matches the full fixture visit set exactly
- Fails if any visit remains missing or an incorrect subset is shown
- Independent because clearing state is isolated per test run

## Notes
- This file defines test cases only in Given/When/Then format.
- No implementation code is included.
