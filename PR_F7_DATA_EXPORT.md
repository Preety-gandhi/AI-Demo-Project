## PR: F7 --- Data Export (CSV/PDF)

### Summary

Enables physicians to export patient or visit data in CSV or PDF format for sharing, reporting, and recordkeeping.

This adds export generation for selected patient records or filtered visit history and blocks empty exports with a clear user-facing message.

### Spec

specs/F7_Data_Export.md

### Acceptance Criteria

| AC | Criterion | Status | Evidence |
|---|---|---|---|
| AC-1 | Selecting a patient or filtered visit list and choosing Export → CSV or Export → PDF generates and downloads the requested file in the chosen format | PASS | tests/unit/F7_Data_Export.test.js:28-49; tests/integration/F7_with_F1_F5.integration.test.js:64-123 |
| AC-2 | Empty data set blocks export and displays "No data available to export" | PASS | tests/unit/F7_Data_Export.test.js:55-66; tests/integration/F7_with_F1_F5.integration.test.js:126-138 |

### Test Evidence

Command: cmd /c npx.cmd vitest run tests/unit/F7_Data_Export.test.js tests/integration/F7_with_F1_F5.integration.test.js

Result: 2 test files passed. 8 tests passed. 0 failed.

### Security

Secret scan: clean. New dependencies: none. Validation: no changes.

### Observability

Logs: export.started, export.completed, export.blocked_empty_dataset.

Metrics: export.count, export.duration_ms, export.empty_dataset_count.

### Feature Flag

Flag: not required for this phase.

Rollout plan: release with direct feature access and empty-dataset validation guard in place.

### Rollback

Option A (< 1 min): remove or disable the export actions from the UI.

Option B (~10 min): git revert the feature commit and redeploy the previous build.

### Merge Decision

APPROVE --- all ACs pass, F7 export tests green, no security concerns, rollback path available.
