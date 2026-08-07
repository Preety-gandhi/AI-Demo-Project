# Feature Specification: F7 — Data Export

## 1. Description
Allows the physician to export patient or visit data for sharing or recordkeeping.

## 5. Goal
To enable the physician to download patient or visit data in standard formats for reporting and recordkeeping.

## 6. Non-Goal
This feature does not include automated reporting workflows, direct email delivery, or large-scale data warehousing.

## 7. Current behaviour
Data export may not be available or may require manual copying from the application, making it hard to share records reliably.

## 8. Expected behaviour
The system should generate and download the requested CSV or PDF file when the physician selects a patient or visit dataset.

## 9. Scope
This feature includes exporting patient or visit records to CSV and PDF, and handling cases where no data is available.

## 10. Acceptance Criteria
### Scenario 1: Happy path
Given a physician selects a patient or visit dataset with available records
When they choose CSV or PDF export
Then the system generates and downloads the requested file format.

### Scenario 2: Empty dataset case
Given a physician attempts to export a dataset with no available records
When the export action is triggered
Then the system prevents export and shows a message that no data is available.


