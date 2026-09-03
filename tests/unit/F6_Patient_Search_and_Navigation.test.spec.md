# Test Cases from Acceptance Criteria: F6 - Patient Search and Navigation
Source Spec: specs/F6_Patient_Search_and_Navigation.md

## AC1 - Scenario 1: Happy path
Given the physician types a full or partial patient name or phone number in search
When they execute the search
Then matching patient records are returned sorted by relevance and recent activity

### test_AC1_search_by_full_patient_name_returns_exact_match
Given a patient repository fixture contains a patient with an exact full-name match to the query
When the physician executes a search using that full name
Then the exact matching patient record is included in the returned results

Mocks/Fixtures:
- Patient repository mock returning a fixed set of patients including an exact full-name match
- Fixture: expected matched patient record for comparison

Binary/Independent Verification:
- Pass if and only if the exact-match record is present in the result set
- Fails if the record is missing or additional unrelated records are returned instead
- Independent because the repository fixture is fully self-contained per test

### test_AC1_search_by_partial_name_returns_all_matching_patients
Given a patient repository fixture contains multiple patients whose names share a common partial substring
When the physician executes a search using that partial substring
Then all patients whose names contain the substring are returned

Mocks/Fixtures:
- Patient repository mock returning patients with overlapping partial-name matches
- Fixture: expected subset of matching patient IDs

Binary/Independent Verification:
- Pass if and only if the returned set exactly matches the expected subset of patient IDs
- Fails if any matching patient is omitted or any non-matching patient is included
- Independent because the fixture dataset is fixed and local to the test

### test_AC1_search_by_phone_number_returns_matching_patients
Given a patient repository fixture contains patients with distinct phone numbers in varied formats
When the physician executes a search using a full or partial phone number
Then all patients whose phone number matches are returned regardless of formatting

Mocks/Fixtures:
- Patient repository mock returning patients with varied phone number formats
- Mock normalized phone-matching helper
- Fixture: expected matching patient IDs for a given phone query

Binary/Independent Verification:
- Pass if and only if the returned set exactly matches the expected phone-matched patient IDs
- Fails if any match is missed due to formatting differences or an unrelated patient is included
- Independent because phone fixtures and the normalization mock are test-local

### test_AC1_results_ordered_by_relevance_then_recent_activity
Given a patient repository fixture contains patients with exact, prefix, and weak matches to the query along with distinct last-visit timestamps
When the physician executes the search
Then results are ordered by match relevance first and by most recent activity second for equal relevance

Mocks/Fixtures:
- Patient repository mock returning patients with mixed relevance levels and last-visit metadata
- Mock ranking/sort function
- Fixture: expected ordered list of patient IDs

Binary/Independent Verification:
- Pass if and only if the returned order exactly matches the expected relevance-then-recency order
- Fails on any out-of-order result
- Independent because ranking inputs are deterministic and fixture-defined

### test_AC1_selecting_search_result_opens_matching_patient_profile
Given a list of search results is displayed including a specific patient record
When the physician selects that specific result
Then the corresponding patient profile view opens for that patient's ID

Mocks/Fixtures:
- Mock navigation/profile-open handler
- Fixture: selected patient ID from the displayed results

Binary/Independent Verification:
- Pass if and only if the opened profile ID matches the selected result's patient ID
- Fails if a different profile opens or no navigation occurs
- Independent because the selection and navigation mock are isolated to this test

### test_AC1_search_query_is_case_insensitive
Given a patient repository fixture contains a patient name stored in mixed case
When the physician executes a search using a different casing than stored
Then the patient record is still returned as a match

Mocks/Fixtures:
- Patient repository mock returning a patient with mixed-case stored name
- Fixture: query string in different casing than the stored name

Binary/Independent Verification:
- Pass if and only if the record is returned despite the casing difference
- Fails if the case-differing query returns no match
- Independent because the casing fixture is fixed and self-contained

### test_AC1_empty_or_whitespace_query_is_blocked
Given the physician enters an empty string or a whitespace-only value as the search query
When the physician executes the search
Then the system blocks the search and displays an input-required message instead of returning results

Mocks/Fixtures:
- Mock search input validator
- Fixture: empty string and whitespace-only query variants
- Mock error/status presenter

Binary/Independent Verification:
- Pass if and only if no search is executed and the input-required message is shown
- Fails if a search executes with an empty query or no message is shown
- Independent because the validator and fixture queries are test-local

## AC2 - Scenario 2: No results
Given the physician searches for a non-existent patient
When they execute the search
Then the system shows a "no results found" message and suggests creating a new patient

### test_AC2_no_results_message_shown_for_nonmatching_query
Given a patient repository fixture contains patients that do not match a given search query
When the physician executes the search using that non-matching query
Then the system displays a "no results found" message and shows an empty result list

Mocks/Fixtures:
- Patient repository mock returning patients that do not match the query
- Mock no-results message component

Binary/Independent Verification:
- Pass if and only if the no-results message is shown and the result list is empty
- Fails if any result is displayed or no message is shown
- Independent because the non-matching fixture is fixed and self-contained

### test_AC2_no_results_state_offers_create_new_patient_action
Given the no-results state is displayed after a non-matching search
When the physician views the no-results message
Then the system shows an action to create a new patient and that action is functional

Mocks/Fixtures:
- Mock create-new-patient action/link component
- Mock navigation callback to the patient creation flow

Binary/Independent Verification:
- Pass if and only if the create-new-patient action is visible and triggers the navigation callback when activated
- Fails if the action is missing or does not invoke navigation
- Independent because the action and navigation mock are isolated to this test

## Notes
- This file defines test cases only in Given/When/Then format.
- No implementation code is included.
