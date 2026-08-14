# Test Specification: F2 - Appointment Scheduling
**Source Spec:** specs/F2_Appointment_Scheduling.md

## Coverage
- AC1: Create appointment and show status Scheduled in daily list
- AC2: Reject conflicting slots and provide corrective guidance

## AC1 Tests

### test_AC1_create_appointment_with_valid_details
Given physician enters patient, date, and time
When physician saves appointment
Then appointment is persisted and appears in daily list with status Scheduled

Mocks/Fixtures:
- Mock patient store with valid patient
- Mock appointment repository save/getAll
- Fixture appointment payload

Binary/Independent:
- PASS only if saved record is in list with status Scheduled
- Runs independently with isolated in-memory store

### test_AC1_create_appointment_with_minimum_required_fields
Given optional fields are blank and required fields are valid
When physician saves
Then save succeeds without optional-field validation errors

Mocks/Fixtures:
- Mock validator for required fields only
- Fixture with required fields only

Binary/Independent:
- PASS if save succeeds and no optional-field error shown
- Isolated form state per test

### test_AC1_appointment_visible_in_daily_schedule
Given an appointment exists for selected date
When physician opens daily schedule
Then appointment is shown in that date's list at correct time ordering

Mocks/Fixtures:
- Mock appointment repository preloaded with same-date data
- Fixture sorted time slots

Binary/Independent:
- PASS only if entry appears in expected position
- Independent via preloaded fixture

## AC2 Tests

### test_AC2_reject_exact_time_conflict
Given an existing appointment already occupies same date/time slot
When physician tries to save another appointment on that slot
Then save is blocked and conflict message is displayed

Mocks/Fixtures:
- Repository with existing same-slot appointment
- Mock error message presenter

Binary/Independent:
- PASS only if record count unchanged and message shown
- Independent with isolated repository

### test_AC2_reject_overlapping_range_conflict
Given an existing appointment from 10:30 to 11:00
When physician saves one from 10:45 to 11:15
Then system blocks save due to overlap

Mocks/Fixtures:
- Mock overlap detector
- Fixture overlapping intervals

Binary/Independent:
- PASS only if overlap is detected and save fails
- Independent overlap fixture

### test_AC2_suggest_alternative_slots_on_conflict
Given requested slot is unavailable
When conflict occurs on save
Then system suggests at least one available alternative time

Mocks/Fixtures:
- Mock availability service
- Fixture occupied and open slots

Binary/Independent:
- PASS only if alternatives list returned with valid slots
- Independent with deterministic slot fixture

## Additional Validation Tests

### test_AC1_reject_missing_patient
Given patient is not selected
When save is attempted
Then save is blocked and patient-required validation is shown

### test_AC1_reject_invalid_time_format
Given time is malformed
When save is attempted
Then validation blocks save and shows format error

### test_AC1_reject_past_date
Given appointment date is in the past
When save is attempted
Then validation blocks save with past-date error

## Notes
- All tests are Given/When/Then only; no implementation code.
- Each test is binary and designed to run independently.
