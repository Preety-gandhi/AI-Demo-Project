# Plan: F7 — Data Export (CSV/PDF)

## Source
**Reference:** [specs/features/PatientManagement.feature.md](../../specs/features/PatientManagement.feature.md) | F7 — Data Export (CSV/PDF)

**Spec Location:** [specs/F7_Data_Export.md](../../specs/F7_Data_Export.md)

---

**TL;DR:** Implement centralized export service and utilities for CSV and PDF generation. Connect export buttons to patient list and visit history screens. Block exports for empty datasets with message "No data available to export". Support filtered data export (only visible rows). Use jsPDF v6+ with autoTable plugin for PDF generation. Verify both acceptance scenarios: happy-path export and empty-dataset blocking.

---

## Dependencies & Integration Points

**This plan depends on:**
- ✅ **F1 (Patient Profile Management)** — Patient data fields and patient list screen
- ✅ **F5 (Visit History Review)** — Visit history view with filtered consultation data
- ✅ **F2 (Appointment Scheduling)** — Optional: Appointment data for enriched export (not MVP)

**This plan integrates with:**
- **F1 Patient List** — Add export buttons (CSV/PDF) to patient-list.html
- **F5 Visit History** — Add export buttons (CSV/PDF) to patient-visit-history.html (filtered data)
- **F5 All-Patients View** — Export "All Visits" data from all-visit-history.html

---

## Key Design Decisions (Finalized ✅)

1. **PDF Library** — DECIDED: **jsPDF v6+ with autoTable plugin** (not html2pdf; more reliable for table export, lighter weight)
2. **Export Scope** — Only currently visible/filtered rows (not entire unfiltered dataset)
3. **Date Format** — Locale-formatted dates in exports (e.g., "13/08/2026" or "08/13/2026" based on locale)
4. **Empty Dataset Handling** — Block export with exact message: "No data available to export"
5. **Filename Format** — Timestamp-based: `patients_YYYYMMDD_HHMM.csv`, `visits_YYYYMMDD_HHMM.pdf`, etc.
6. **Filter Context** — Active date filter summary included in PDF header (e.g., "Filtered: Last 30 days")
7. **Concurrent Export Prevention** — Disable export buttons during generation to prevent duplicates
8. **Field Mapping** — Centralized mapping of export columns (consistent across CSV and PDF)

---

## Approved Decisions (Background)
- PDF generation approach: use JavaScript library for direct PDF file creation (jsPDF chosen).
- Patient export scope: export only currently visible/filtered rows.
- Date format in exports: use locale-formatted dates.

---

## Relevant Files — Complete List

### New Files (6 files):

**Core Export Services:**
1. `frontend/js/services/exportService.js` — Central orchestration service (validation, routing to CSV/PDF methods)
2. `frontend/js/services/exportFieldMappers.js` — Canonical export field mappings and formatting rules

**Export Utilities:**
3. `frontend/js/utils/csvExporter.js` — CSV generation utility (with proper escaping)
4. `frontend/js/utils/pdfExporter.js` — PDF generation utility (jsPDF + autoTable)
5. `frontend/js/utils/fileDownload.js` — Browser download helper (Blob/URL management)

**Testing & Documentation:**
6. `frontend/.ai/plans/F7_Data_Export_Test_Checklist.md` — Manual test checklist (Scenario 1 & 2)

### Modified Files (4 files):

1. `frontend/html/patient-list.html` — Add CSV/PDF export buttons (F1 integration)
2. `frontend/js/patientList.js` — Wire export handlers and UI feedback
3. `frontend/html/patient-visit-history.html` — Add CSV/PDF export buttons (F5 integration)
4. `frontend/js/visitHistoryView.js` — Wire filtered export + filter summary in PDF header
5. `frontend/css/styles.css` — Add export button styles and feedback alert styles (if not already present)

**Optional F5 Enhancement:**
6. `frontend/html/all-visit-history.html` — Add CSV/PDF export for all-patients view (all-patients export)
7. `frontend/js/allVisitHistoryView.js` — Wire all-patients export

---

## Implementation Sequence

### Recommended Order (Core MVP):

**Day 1 — Foundation Services:**
- Step 1: exportService.js (orchestration, validation)
- Step 2: csvExporter.js (CSV generation)

**Day 2 — PDF & Utilities:**
- Step 3: pdfExporter.js (PDF generation with jsPDF + autoTable)
- Step 4: fileDownload.js (browser download helper)
- Step 7: exportFieldMappers.js (field mapping & formatting)

**Day 3 — Patient List Integration:**
- Step 5: patient-list.html + patientList.js (add export buttons, wire handlers)

**Day 4 — Visit History Integration:**
- Step 6: patient-visit-history.html + visitHistoryView.js (add filtered export, filter summary in PDF)

**Day 5 — Polish & Testing:**
- Step 8: styles.css + UI feedback states (success/error alerts, button disable during export)
- Step 9: Manual acceptance testing (verify Scenario 1 happy path + Scenario 2 empty dataset blocking)

**Optional Enhancement (Day 6 if F5 all-patients view available):**
- All-patients view export (steps 6a, 6b)

**Estimated Duration:** 5 days (core MVP with patient list + visit history export)

---

## Pre-Implementation Verification Checklist

### Dependencies Available:
- [x] F1 patient storage and patient-list.html/patientList.js available and accessible
- [x] F5 visit history views (patient-visit-history.html, visitHistoryView.js) available
- [x] F5 filter state management available (date filters, active filter tracking)
- [x] localStorage API accessible in target browsers
- [x] Bootstrap CSS included in project
- [x] jsPDF v6+ library available or can be added via CDN/npm
- [x] autoTable plugin for jsPDF available

### Plan Structure Valid:
- [x] Steps 1-9 are logically sequenced and revertible
- [x] Each step modifies/creates only one logical module or pair of related files
- [x] No circular dependencies between steps
- [x] Integration points clearly documented (F1 patient list, F5 visit history)
- [x] PDF library decision finalized (jsPDF v6+ with autoTable)

### Requirements Covered:
- [x] CSV export for patient list (filtered)
- [x] PDF export for patient list (filtered)
- [x] CSV export for visit history (filtered by date)
- [x] PDF export for visit history (with filter summary in header)
- [x] Empty dataset blocking with exact message
- [x] Concurrent export prevention (button disabling)
- [x] Field mapping centralized (consistent formatting)
- [x] Locale-formatted dates in exports
- [x] Timestamp-based filenames
- [x] Both spec scenarios covered (Scenario 1 & 2)

### Design Decisions Finalized:
- [x] PDF library: jsPDF v6+ with autoTable (DECIDED, not "example")
- [x] Export scope: filtered data only (not unfiltered)
- [x] Empty dataset message: exact text "No data available to export"
- [x] Filter context in PDF: included in header
- [x] Concurrent export: prevented via button disable state
- [x] Field mapping: centralized in exportFieldMappers.js

---

## Risk Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| jsPDF library not available | Medium | Add to project dependencies (npm/CDN); document in setup |
| Large dataset export (100+ rows) | Medium | MVP acceptable; pagination/streaming added in enhancement phase |
| PDF formatting overflow | Medium | Test with real patient data; adjust column widths if needed |
| Locale date formatting edge cases | Low | Use native `toLocaleString()` with fallback formatting |
| Filter state mismatch (displayed vs exported) | Medium | Export only data in current controller state, not localStorage |
| Browser memory/performance during PDF generation | Medium | Disable export button during generation; show progress feedback |
| F1/F5 data contracts change | Low | Use defensive coding (check field existence); add fallback values |
| Concurrent clicks creating duplicate exports | Medium | Disable export buttons during generation; re-enable on completion |
| Date picker browser compatibility | Low | Test with Chrome, Firefox, Safari, Edge (2023+) |

---

## Test Data Requirements

For manual testing, create:
1. **Patient List Test Data:**
   - 5+ patients with complete information
   - Test CSV export with varied data (names, contact info, etc.)
   - Test PDF export with patient count >1 page
   - Test empty patient list (0 patients) → blocked export

2. **Visit History Test Data:**
   - Patient with 8+ consultations across different dates
   - Test date filter (Last Month) → export filtered data only
   - Test date filter returning 0 results → blocked export
   - Test PDF header includes filter summary ("Filtered: Last 30 days")

3. **Acceptance Scenario 1 (Happy Path):**
   - Patient list with data → export CSV/PDF successfully
   - Visit history with filtered data → export CSV/PDF successfully
   - Verify files created with correct names and content

4. **Acceptance Scenario 2 (Empty Dataset):**
   - Empty patient list → export blocked, show message
   - Visit history with filter returning no results → export blocked, show message
   - Verify exact message: "No data available to export"

---

## Success Criteria

- ✅ Spec Scenario 1 (Happy Path) passes:
  - Patient list exports to CSV and PDF successfully
  - Visit history exports to CSV and PDF successfully (filtered data only)
  - Files have correct names, timestamps, and formatted data
- ✅ Spec Scenario 2 (Empty Dataset) passes:
  - Empty patient list blocks export with exact message
  - Empty filtered visit history blocks export with exact message
- ✅ No JavaScript errors in browser console
- ✅ PDF files readable and properly formatted with jsPDF + autoTable
- ✅ CSV files importable into Excel/Sheets
- ✅ All vitals and dates formatted consistently with locale settings
- ✅ Concurrent export attempts prevented (button disabled during generation)
- ✅ Filter context visible in PDF header (e.g., "Filtered: Last 30 days")

---

## Implementation Details for Specific Steps

### Step 1: exportService.js Interface
```javascript
// Validation: returns { success: true/false, message, data }
exportPatientsToCsv(patients)      // returns CSV string
exportPatientsToPdf(patients)      // returns PDF Blob
exportVisitsToCsv(visits, filterSummary)     // returns CSV string
exportVisitsToPdf(visits, filterSummary)     // returns PDF Blob
validateDataset(data, context)     // throws if empty, returns validation result
```

### Step 3: pdfExporter.js with jsPDF + autoTable
```javascript
// Use jsPDF autoTable plugin:
// https://github.com/parallax/jsPDF-AutoTable
// Example: doc.autoTable({ head: [[...]], body: [...], margin: {top: 50} })
```

### Step 7: exportFieldMappers.js
Define canonical columns:
```javascript
const patientExportFields = [
  { key: 'id', label: 'Patient ID' },
  { key: 'name', label: 'Name' },
  { key: 'dob', label: 'Date of Birth', formatter: formatDate },
  { key: 'contactNumber', label: 'Contact', formatter: (v) => v || 'N/A' },
  ...
]
```

---

## Status

✅ **REFACTORED & READY FOR IMPLEMENTATION**

**Key Improvements in This Refactoring:**
1. ✅ **PDF Library Decision:** Changed from "example (jsPDF + autoTable)" to **DECIDED: jsPDF v6+ with autoTable**
2. ✅ Added **Dependencies & Integration Points** section (F1, F5, F2 with clear flag for optional)
3. ✅ Added **Key Design Decisions** section (8 finalized decisions at top)
4. ✅ Added **Relevant Files** summary (6 new files + 5 modified files with organization)
5. ✅ Added **Implementation Sequence** with timeline (5 days for core MVP)
6. ✅ Added **Pre-Implementation Verification Checklist** (22-item verification list)
7. ✅ Added **Risk Mitigation** section (9 identified risks with mitigations)
8. ✅ Added **Success Criteria** (8 clear success conditions)
9. ✅ Added **Implementation Details** (code interface samples for key steps)

**All design decisions finalized. PDF library explicitly decided. Ready for implementation.**

---

## Notes for Implementer

1. **jsPDF Integration:** Add jsPDF v6+ (with autoTable) to project via npm or CDN. Test library loading before Step 3.
2. **Filter Summary in PDF:** Pass `filterSummary` parameter from controller (e.g., "Filtered: Last 30 days") to pdfExporter. Include in PDF header/footer.
3. **Locale Date Formatting:** Use `new Date(...).toLocaleString()` for locale-aware formatting. Test with different browser locales.
4. **Export Button States:** 
   - Normal state: enabled, shows "Export CSV" / "Export PDF"
   - During export: disabled, shows "Exporting..."
   - After export: re-enabled, briefly show "Downloaded" notification
5. **CSV Escaping:** Properly escape commas, quotes, newlines. Use standard CSV escaping: wrap field in quotes if contains comma/quote/newline; escape quotes as `""`.
6. **Field Validation:** Add defensive checks in exportFieldMappers.js; if field missing, use "N/A" fallback.
7. **Error Handling:** Catch jsPDF generation errors; show user-friendly error message instead of JavaScript error.
8. **Performance:** Monitor export time for large datasets (100+ rows); consider async processing if needed.
9. **Testing Order:** Test happy path first (export succeeds), then empty dataset (export blocked), then concurrent clicks (prevent duplicates).

---

### Step 1 - Add centralized export orchestration service
- Exact files to change:
  - d:\Paitent Management system\frontend\js\services\exportService.js (new)
- What the change does:
  - Adds a single entry point for export operations.
  - Exposes methods like exportPatientsToCsv, exportPatientsToPdf, exportVisitsToCsv, exportVisitsToPdf.
  - Validates dataset presence before export and returns a standardized error result when empty.
  - Enforces the message: "No data available to export".
- Risks or assumptions:
  - Assumes F1 and F5 data objects have stable field names.
  - Risk of tight coupling if screens depend on internal formatter details.
- How to verify the step is correct:
  - Call each method with sample non-empty data and confirm success response.
  - Call each method with empty arrays and confirm failure response + exact message text.

### Step 2 - Add CSV generation utility
- Exact files to change:
  - d:\Paitent Management system\frontend\js\utils\csvExporter.js (new)
- What the change does:
  - Converts patient and visit datasets into CSV strings with headers.
  - Escapes commas, quotes, and newlines correctly.
  - Supports separate schemas for patient export and visit export.
- Risks or assumptions:
  - Assumes text encoding UTF-8 is acceptable for downstream tools.
  - Risk of malformed CSV if escaping rules are incomplete.
- How to verify the step is correct:
  - Export rows containing commas and quotes, open in Excel/Sheets, and verify column integrity.
  - Validate header columns map exactly to expected patient/visit fields.

### Step 3 - Add PDF document generation utility
- Exact files to change:
  - d:\Paitent Management system\frontend\js\utils\pdfExporter.js (new)
- What the change does:
  - Produces downloadable PDF documents for patient and visit datasets.
  - Renders title, generated timestamp, applied filter summary, and tabular data rows.
  - Uses **jsPDF v6+ with autoTable plugin** for direct PDF generation (DECIDED library, not example).
- Risks or assumptions:
  - Assumes browser environment supports jsPDF and autoTable.
  - Risk of layout overflow for large datasets.
  - jsPDF library must be loaded before pdfExporter is called.
- How to verify the step is correct:
  - Generate PDF for small and medium datasets and open output files to confirm readability.
  - Confirm column alignment and pagination behavior across multiple pages.
  - Verify PDF includes title, timestamp, and filter summary in header.

### Step 4 - Add file download helper
- Exact files to change:
  - d:\Paitent Management system\frontend\js\utils\fileDownload.js (new)
- What the change does:
  - Provides reusable browser download helper for Blob/text content.
  - Standardizes filename format, such as patients_YYYYMMDD_HHMM.csv and visits_YYYYMMDD_HHMM.pdf.
- Risks or assumptions:
  - Assumes modern browser support for Blob and URL.createObjectURL.
  - Risk of memory leaks if object URLs are not revoked.
- How to verify the step is correct:
  - Trigger CSV and PDF download and verify file names and extensions.
  - Confirm repeated exports do not degrade browser responsiveness.

### Step 5 - Add export controls to patient list UI
- Exact files to change:
  - d:\Paitent Management system\frontend\html\patient-list.html (modify)
  - d:\Paitent Management system\frontend\js\patientList.js (modify)
- What the change does:
  - Adds Export control (CSV/PDF options) to patient list screen.
  - Wires only the currently visible/filtered patient dataset to exportService.
  - Shows user feedback when export succeeds/fails.
- Risks or assumptions:
  - Assumes patient list data is already loaded in patientList.js.
  - Risk of exporting stale or unfiltered data if UI state is not sourced correctly.
- How to verify the step is correct:
  - From patient list with data, export CSV and PDF successfully.
  - From empty patient list, export is blocked and exact message is displayed.

### Step 6 - Add export controls to visit history UI
- Exact files to change:
  - d:\Paitent Management system\frontend\html\patient-visit-history.html (modify)
  - d:\Paitent Management system\frontend\js\visitHistoryView.js (modify)
- What the change does:
  - Adds Export control (CSV/PDF) to visit history screen.
  - Exports currently filtered visit dataset, not unfiltered full history.
  - Includes active date-filter context in exported metadata/header.
- Risks or assumptions:
  - Assumes F5 filter state is available in visitHistoryView.js at export time.
  - Risk of mismatch between displayed rows and exported rows.
- How to verify the step is correct:
  - Apply a date filter and export; verify only visible filtered rows are in files.
  - Set filter that returns zero rows; confirm export is blocked with required message.

### Step 7 - Add shared field mapping and formatting rules
- Exact files to change:
  - d:\Paitent Management system\frontend\js\services\exportFieldMappers.js (new)
- What the change does:
  - Defines canonical exported columns for patient and visit records.
  - Centralizes value formatting (locale-formatted dates, vitals, empty placeholders) to keep CSV/PDF consistent.
- Risks or assumptions:
  - Assumes agreement on exported column contract.
  - Risk of breaking backward compatibility if field names change later.
- How to verify the step is correct:
  - Compare CSV headers and PDF table headers for consistency.
  - Spot-check rows for expected formatted values.

### Step 8 - Add UI states for export feedback
- Exact files to change:
  - d:\Paitent Management system\frontend\css\styles.css (modify)
  - d:\Paitent Management system\frontend\js\patientList.js (modify)
  - d:\Paitent Management system\frontend\js\visitHistoryView.js (modify)
- What the change does:
  - Adds consistent status alerts/toasts for export success and failure.
  - Disables export actions while generation is in progress to prevent duplicate exports.
- Risks or assumptions:
  - Assumes existing UI style conventions from F1/F5 can be reused.
  - Risk of duplicate state handlers if each page implements feedback differently.
- How to verify the step is correct:
  - Trigger repeated clicks during export and confirm only one file is generated.
  - Confirm success and failure messages are visible and clear.

### Step 9 - Add acceptance-focused manual test checklist
- Exact files to change:
  - d:\Paitent Management system\.ai\plans\F7_Data_Export_Test_Checklist.md (new)
- What the change does:
  - Adds repeatable validation script for Scenario 1 (happy path) and Scenario 2 (empty dataset).
  - Documents exact test data setup, actions, and expected outcomes.
- Risks or assumptions:
  - Assumes manual testing is primary validation mode in current project phase.
- How to verify the step is correct:
  - Execute checklist end-to-end and record pass/fail per scenario.

---

---

## Detailed Implementation Notes

### Step 1 - Add centralized export orchestration service
