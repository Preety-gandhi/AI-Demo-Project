# Test Specification: F7 - Data Export (CSV/PDF)
**Source Spec:** specs/F7_Data_Export.md

## Coverage
- AC1: Export patient/visit dataset to selected CSV or PDF format
- AC2: Block export when selected dataset is empty

## AC1 Tests

### test_AC1_export_patient_dataset_to_csv
Given physician selected valid patient dataset
When physician chooses Export to CSV
Then system generates and downloads CSV file with expected headers and rows

Mocks/Fixtures:
- Mock data source with patient rows
- Mock CSV builder
- Mock browser download trigger

Binary/Independent:
- PASS if file is generated and download triggered with expected CSV content
- Independent fixture dataset

### test_AC1_export_visit_dataset_to_pdf
Given physician selected valid filtered visit dataset
When physician chooses Export to PDF
Then system generates and downloads printable PDF with selected records

Mocks/Fixtures:
- Mock visit dataset
- Mock PDF generator
- Mock browser download API

Binary/Independent:
- PASS if PDF output generated and download triggered
- Independent dataset fixture

### test_AC1_export_respects_active_filter_selection
Given only subset of visits is visible due to active filters
When export is triggered
Then exported file contains only currently selected/filtered records

Mocks/Fixtures:
- Full dataset and filtered subset fixtures
- Mock filter-state provider

Binary/Independent:
- PASS if export rows equal filtered subset only
- Independent filter fixture

### test_AC1_export_filename_is_deterministic
Given export type and dataset context are known
When file is generated
Then filename follows agreed pattern with format and date stamp

Mocks/Fixtures:
- Mock clock/date provider
- Fixture filename pattern

Binary/Independent:
- PASS if filename matches pattern exactly
- Independent deterministic clock

## AC2 Tests

### test_AC2_block_export_when_dataset_empty
Given current selection has zero records
When physician triggers export
Then system prevents export and displays No data available to export

Mocks/Fixtures:
- Empty dataset fixture
- Mock message presenter

Binary/Independent:
- PASS if no file is generated and message shown
- Independent empty fixture

### test_AC2_disable_export_actions_for_empty_state
Given selected dataset is empty
When export controls render
Then CSV/PDF export actions are disabled or guarded

Mocks/Fixtures:
- Mock export action state
- Empty data fixture

Binary/Independent:
- PASS if actions cannot trigger generation
- Independent UI state fixture

## Additional Validation Tests

### test_AC1_escape_special_characters_in_csv
Given fields contain commas, quotes, or line breaks
When CSV export runs
Then output is properly escaped and parseable

### test_AC1_export_is_read_only_operation
Given source data snapshot before export
When export completes
Then source data remains unchanged

## Notes
- Given/When/Then only.
- Tests are binary and independent.
