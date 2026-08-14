# Test Specification: F4 - Prescription Generation
**Source Spec:** specs/F4_Prescription_Generation.md

## Coverage
- AC1: Generate printable prescription from valid consultation with medication
- AC2: Handle zero-medication edge case safely

## AC1 Tests

### test_AC1_generate_printable_prescription_from_valid_consultation
Given consultation is saved with at least one medication
When physician selects Generate Prescription
Then system creates printable document with header, patient details, vitals, diagnosis, medications, and footer

Mocks/Fixtures:
- Mock consultation repository with valid consultation
- Mock prescription generator
- Fixture expected document sections

Binary/Independent:
- PASS if all required sections exist in output document
- Independent via fixed fixture

### test_AC1_include_all_medications_in_prescription
Given consultation has multiple medications
When prescription is generated
Then each medication appears with dosage and instructions

Mocks/Fixtures:
- Consultation fixture with medication array
- Mock template renderer

Binary/Independent:
- PASS if medication list matches fixture exactly
- Independent fixture-based run

### test_AC1_support_preview_and_print_action
Given prescription generation succeeds
When physician opens preview and selects print
Then preview renders correctly and print action is triggered

Mocks/Fixtures:
- Mock preview component
- Mock print API

Binary/Independent:
- PASS if preview renders and print trigger called
- Independent mocked browser APIs

## AC2 Tests

### test_AC2_block_generation_when_no_medications
Given consultation has zero medications
When physician attempts generation
Then system blocks generation and shows no-medication message

Mocks/Fixtures:
- Consultation fixture with empty medication list
- Mock error presenter

Binary/Independent:
- PASS if no document generated and error shown
- Independent isolated generator state

### test_AC2_offer_recovery_path_for_no_medications
Given generation is blocked due to no medications
When error is displayed
Then system prompts user to add medication before retry

Mocks/Fixtures:
- Mock UI action link/button
- Mock navigation callback

Binary/Independent:
- PASS if recovery action is visible and functional
- Independent UI fixture

## Additional Validation Tests

### test_AC1_block_generation_without_consultation_context
Given no consultation is selected
When physician triggers generation
Then system blocks and shows consultation-required message

### test_AC1_prescription_output_has_exportable_filename
Given prescription is generated
When document is prepared for save/print
Then filename follows deterministic pattern with patient/date

## Notes
- Given/When/Then only.
- Tests are binary and independent.
