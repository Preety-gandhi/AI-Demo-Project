# Test Specification: F6 - Patient Search and Navigation
**Source Spec:** specs/F6_Patient_Search_and_Navigation.md

## Coverage
- AC1: Search by full/partial name or phone and rank results
- AC2: No-results handling with create-patient guidance

## AC1 Tests

### test_AC1_search_by_full_name_returns_exact_match
Given patient store contains exact full-name match
When physician searches by full patient name
Then exact matching record is returned

Mocks/Fixtures:
- Mock patient repository
- Full-name query fixture

Binary/Independent:
- PASS if exact record appears in result set
- Independent repository fixture

### test_AC1_search_by_partial_name_returns_matches
Given multiple patients share matching partial name
When physician searches with partial string
Then matching records are returned

### test_AC1_search_by_phone_returns_matches
Given patients have phone numbers stored
When physician searches with full or partial phone
Then matching patient records are returned

Mocks/Fixtures:
- Mock normalized phone search helper
- Patient fixtures with varied phone formats

Binary/Independent:
- PASS if relevant phone matches returned
- Independent fixtures

### test_AC1_sort_results_by_relevance_then_recent_activity
Given multiple records match query at different relevance levels
When search executes
Then results are ordered by relevance first, recency second

Mocks/Fixtures:
- Mock ranking function
- Fixture with exact, prefix, and weak matches plus last-visit metadata

Binary/Independent:
- PASS if output order matches ranking rules
- Independent deterministic ranking fixture

### test_AC1_open_patient_profile_from_search_result
Given search results are displayed
When physician selects a result
Then corresponding patient profile opens

Mocks/Fixtures:
- Mock navigation callback
- Fixture selected patient id

Binary/Independent:
- PASS if opened profile id matches selected result
- Independent isolated view state

## AC2 Tests

### test_AC2_show_no_results_message_for_nonexistent_query
Given no patient matches query
When physician executes search
Then system shows no-results message

Mocks/Fixtures:
- Empty match repository response
- Mock no-results component

Binary/Independent:
- PASS if message displayed and results list empty
- Independent no-match fixture

### test_AC2_suggest_create_new_patient_on_no_results
Given search returned no matches
When no-results state is shown
Then system suggests creating a new patient

Mocks/Fixtures:
- Mock action button/link in no-results view
- Mock navigation to create-patient flow

Binary/Independent:
- PASS if create-new action visible and callable
- Independent UI fixture

## Additional Validation Tests

### test_AC1_reject_empty_query
Given query is empty or whitespace
When physician executes search
Then system blocks search and shows input-required message

### test_AC1_case_insensitive_search
Given patient names contain mixed casing
When physician searches with different casing
Then matching is case-insensitive

## Notes
- Given/When/Then only.
- Tests are binary and independent.
