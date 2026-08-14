# Test Specification: F3 - Consultation Record Capture
**Source Spec:** specs/F3_Consultation_Record_Capture.md

## Coverage
- AC1: Save complete consultation and link to patient history
- AC2: Block save when mandatory vitals are missing

## AC1 Tests

### test_AC1_save_consultation_with_all_required_clinical_fields
Given physician opened consultation form for a valid patient visit
When physician enters vitals, complaints, diagnosis, and medications then saves
Then consultation is saved and linked to patient visit history

Mocks/Fixtures:
- Mock patient store and visit context
- Mock consultation repository save/link methods
- Fixture complete consultation payload

Binary/Independent:
- PASS if record saved and appears under patient history
- Independent via isolated repository

### test_AC1_save_consultation_with_multiple_medications
Given consultation includes multiple medications
When save is submitted
Then all medication entries are stored and retrievable

Mocks/Fixtures:
- Mock consultation repository
- Fixture with medication array

Binary/Independent:
- PASS if medication count and content match fixture
- Independent isolated store

### test_AC1_timestamp_and_status_set_on_save
Given consultation form has valid clinical content
When physician saves
Then system stamps save timestamp and completed status

Mocks/Fixtures:
- Mock date/time provider
- Mock repository

Binary/Independent:
- PASS if timestamp/status fields are present and valid
- Independent deterministic clock

## AC2 Tests

### test_AC2_block_save_missing_temperature
Given temperature is missing while other fields exist
When save is attempted
Then save is blocked and temperature-required message is shown

Mocks/Fixtures:
- Mock validator with field-level errors
- Fixture with missing temperature

Binary/Independent:
- PASS if no persistence occurs and error is shown
- Independent validator state

### test_AC2_block_save_missing_blood_pressure
Given blood pressure is missing
When save is attempted
Then save is blocked with blood-pressure-required error

### test_AC2_block_save_missing_pulse
Given pulse is missing
When save is attempted
Then save is blocked with pulse-required error

### test_AC2_block_save_missing_all_mandatory_vitals
Given temperature, blood pressure, and pulse are all missing
When save is attempted
Then save is blocked and all missing-vitals errors are displayed together

Mocks/Fixtures:
- Mock multi-error validator
- Empty vitals fixture

Binary/Independent:
- PASS if all expected errors appear in one response
- Independent with isolated validation context

## Additional Validation Tests

### test_AC1_block_save_without_patient_context
Given no patient context is attached
When physician attempts save
Then save is blocked with patient-required error

### test_AC1_block_duplicate_consultation_for_same_visit
Given a consultation already exists for the same visit
When another save is attempted for that visit
Then duplicate save is blocked with explicit message

## Notes
- Given/When/Then specification only.
- All tests are binary and independent.
