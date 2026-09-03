# Test Cases from Acceptance Criteria: F7 - Data Export (CSV/PDF)
Source Spec: specs/F7_Data_Export.md

## AC1 - Scenario 1: Happy path
Given the physician selects a patient or filtered visit list
When they choose Export -> CSV or Export -> PDF
Then the system generates and downloads the requested file in the chosen format

### test_AC1_export_selected_patient_dataset_to_csv
Given a patient dataset fixture contains selected patient records
When the physician chooses Export -> CSV
Then a CSV file is generated and downloaded with the expected headers and selected patient rows

Mocks/Fixtures:
- Patient repository mock returning the selected patient dataset
- CSV builder mock
- Browser download trigger mock
- Fixture: expected CSV headers and rows

Binary/Independent Verification:
- Pass if and only if one CSV file is generated, downloaded, and contains the exact expected headers and rows
- Fails if content is missing, altered, or the download is not triggered
- Independent because the dataset and browser APIs are isolated test fixtures

### test_AC1_export_filtered_visit_dataset_to_csv
Given a filtered visit list fixture contains the visits currently selected by the physician
When the physician chooses Export -> CSV
Then a CSV file is generated containing only the selected filtered visits

Mocks/Fixtures:
- Visit repository mock returning the full visit dataset
- Mock active-filter provider returning the selected subset
- CSV builder mock
- Browser download trigger mock
- Fixture: expected filtered visit rows

Binary/Independent Verification:
- Pass if and only if exported CSV rows exactly match the filtered visit fixture
- Fails if an excluded visit is present or an included visit is missing
- Independent because filter state and source data are reset for the test

### test_AC1_export_selected_visit_dataset_to_pdf
Given a selected visit dataset fixture contains valid visit records
When the physician chooses Export -> PDF
Then a printable PDF file is generated and downloaded containing the selected visit records

Mocks/Fixtures:
- Visit repository mock returning selected records
- PDF generator mock
- Browser download API mock
- Fixture: expected printable visit content

Binary/Independent Verification:
- Pass if and only if a PDF output is generated, marked printable, downloaded, and contains every selected visit
- Fails if PDF generation, printability, download, or any selected record is missing
- Independent because generator and browser behavior are mocked per test

### test_AC1_export_selected_patient_dataset_to_pdf
Given a selected patient dataset fixture contains valid patient records
When the physician chooses Export -> PDF
Then a printable PDF file is generated and downloaded containing the selected patient records

Mocks/Fixtures:
- Patient repository mock returning selected records
- PDF generator mock
- Browser download API mock
- Fixture: expected printable patient content

Binary/Independent Verification:
- Pass if and only if the generated PDF contains exactly the selected patient records and download is triggered
- Fails if records are omitted, unrelated records are included, or download is not triggered
- Independent because the patient fixture and PDF mock are test-local

### test_AC1_export_filename_includes_format_and_deterministic_context
Given the export format, dataset type, and export date are fixed by fixtures
When the export file is generated
Then the filename includes the dataset context, selected format, and fixed date in the agreed pattern

Mocks/Fixtures:
- Mock clock/date provider returning a fixed date
- Export filename builder
- Fixture: expected CSV and PDF filename patterns

Binary/Independent Verification:
- Pass if and only if the filename exactly matches the expected deterministic pattern for the selected format
- Fails if the extension, context, or date is incorrect
- Independent because the clock and export context are fixed per test

### test_AC1_csv_export_escapes_special_characters
Given selected patient or visit fields contain commas, quotes, and line breaks
When the physician chooses Export -> CSV
Then the generated CSV escapes those fields correctly and remains parseable

Mocks/Fixtures:
- Dataset fixture containing commas, double quotes, and line breaks
- CSV builder mock or parser
- Browser download trigger mock

Binary/Independent Verification:
- Pass if and only if every special-character field round-trips to its original value when the CSV is parsed
- Fails if fields are split, truncated, or malformed
- Independent because the special-character dataset is self-contained

### test_AC1_export_does_not_modify_source_dataset
Given a source patient or visit dataset snapshot is captured before export
When the physician completes a CSV or PDF export
Then the source dataset is unchanged after the export

Mocks/Fixtures:
- Repository mock with a fixed source dataset
- CSV builder and PDF generator mocks
- Browser download trigger mock
- Fixture: deep-equal pre-export source snapshot

Binary/Independent Verification:
- Pass if and only if the source dataset after export is deeply equal to the pre-export snapshot
- Fails if export mutates, deletes, or reorders source records
- Independent because the repository state is recreated for each test

## AC2 - Scenario 2: Empty dataset
Given the selected filter returns zero records
When the physician triggers Export
Then the system prevents export and displays "No data available to export"

### test_AC2_block_csv_export_for_empty_dataset
Given the selected patient or visit dataset fixture contains zero records
When the physician triggers Export -> CSV
Then no CSV file is generated or downloaded and the message "No data available to export" is displayed

Mocks/Fixtures:
- Empty dataset fixture
- CSV generator mock
- Browser download trigger mock
- Status/error presenter mock

Binary/Independent Verification:
- Pass if and only if the exact no-data message is displayed and neither generation nor download occurs
- Fails if a file is produced, download is triggered, or the message differs
- Independent because the empty dataset and all mocks are isolated

### test_AC2_block_pdf_export_for_empty_dataset
Given the selected patient or visit dataset fixture contains zero records
When the physician triggers Export -> PDF
Then no PDF file is generated or downloaded and the message "No data available to export" is displayed

Mocks/Fixtures:
- Empty dataset fixture
- PDF generator mock
- Browser download trigger mock
- Status/error presenter mock

Binary/Independent Verification:
- Pass if and only if the exact no-data message is displayed and neither generation nor download occurs
- Fails if a file is produced, download is triggered, or the message differs
- Independent because the empty dataset and all mocks are isolated

### test_AC2_empty_state_prevents_both_export_actions
Given the selected filter returns zero records
When the export controls render
Then both CSV and PDF export actions are disabled or guarded from generation

Mocks/Fixtures:
- Empty dataset fixture
- Export control state mock
- CSV and PDF generation spies

Binary/Independent Verification:
- Pass if and only if activating either export action cannot generate or download a file
- Fails if either action bypasses the empty-state guard
- Independent because export controls and spies are created fresh for the test

## Notes
- This file defines test cases only in Given/When/Then format.
- No implementation code is included.
