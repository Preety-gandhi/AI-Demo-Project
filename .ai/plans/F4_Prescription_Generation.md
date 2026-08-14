# Plan: F4 — Prescription Generation

## Source
**Reference:** [specs/features/PatientManagement.feature.md](../../specs/features/PatientManagement.feature.md) | F4 — Prescription Generation

**Spec Location:** [specs/F4_Prescription_Generation.md](../../specs/F4_Prescription_Generation.md)

---

**TL;DR:** Implement prescription generation feature that creates a printable document from a saved consultation. Build a prescription data model, a prescription generator utility that validates medication presence and compiles prescription content, a prescription preview/view page with print functionality, and integrate a "Generate Prescription" button into the consultation views. All operations client-side using localStorage; prescriptions persisted for audit trail and history view.

---

## Dependencies & Integration Points

**This plan depends on:**
- ✅ **F1 (Patient Profile Management)** — Patient data (name, DOB, gender, contact)
- ✅ **F3 (Consultation Record Capture)** — Consultation data with vitals and medications
- ✅ **F5 (Visit History Review)** — Optional: Prescription count display in visit history

**This plan integrates with:**
- **F3 View Consultation** — "Generate Prescription" button added to view-consultation.html
- **F5 Visit History** — Prescription count shown in consultation history (optional enhancement)

---

## Key Design Decisions (Finalized ✅)

1. **Prescription Persistence** — Prescriptions stored in localStorage for audit trail and history view (REQUIRED for MVP)
2. **Physician Name** — User prompted to enter on prescription generation page (flexible, allows different physicians)
3. **Medication Details** — Only medication names captured (no dosage/frequency in F3; physician adds manually before printing)
4. **Clinic Configuration** — Minimal, hardcoded format; no admin panel per requirement
5. **PDF Export** — Browser native print-to-PDF sufficient (Ctrl+P); no external library like html2pdf.js
6. **Prescription Validity** — Default 5-day period; auto-calculated expiration date
7. **History Access** — Prescription history accessible from consultation view (NOT added to patient profile per decision)
8. **Consultation Traceability** — Prescription history shows consultation link for full audit trail

---

## Implementation Steps

### Phase 1: Foundation & Data Model

**Step 1 — Create prescription configuration utility** (`frontend/js/config/prescriptionConfig.js`) **[SIMPLIFIED]**
- **What:** Prescription formatting constants (minimal config):
  - `prescriptionFormat` object with:
    - `showVitals` — boolean, include all vitals (temperature, BP, pulse) on prescription (default: true)
    - `vitalsToShow` — array of vital names to display (default: ["temperature", "bpSystolic", "bpDiastolic", "pulse"])
    - `showDiagnosis` — boolean, include diagnosis on prescription (default: true)
    - `showComplaints` — boolean, include chief complaints on prescription (default: true)
    - `medicationFormat` — "list" or "table" (how medications display) (default: "list")
    - `showSignatureLine` — boolean, include signature line for physician (default: true)
    - `prescriptionValidityDays` — default validity period in days (default: 5)
    - `documentTitle` — page title (default: "Prescription")

  **Note:** Clinic name, address, phone removed from config (not needed per decision). Header/footer can be added via HTML template or hardcoded string if needed.

- **Files changed:**
  - `frontend/js/config/prescriptionConfig.js` (new file)

- **Risks:**
  - Format config minimal; hardcoded values cannot be changed at runtime
  - Configuration change requires developer (no admin panel per requirement)

- **Assumptions:**
  - Format settings apply globally to all prescriptions
  - No clinic header/footer config (can be hardcoded in formatter if needed)
  - No per-physician customization

- **How to verify:**
  - File exists and contains prescriptionFormat object
  - Config values accessible globally via `prescriptionConfig.prescriptionFormat.showVitals`, etc.
  - Config changes affect generated prescription output (vitals shown/hidden per config)

---

**Step 2 — Create prescription data model** (`frontend/js/models/prescription.js`)
- **What:** Prescription class representing a generated prescription:
  - `id` (UUID v4) — unique prescription ID (for tracking/history)
  - `consultationId` (UUID v4) — reference to source consultation (required)
  - `patientId` (UUID v4) — reference to patient (from consultation)
  - `generatedBy` (string) — physician/user who generated prescription (required, for audit and display)
  - `generatedAt` (ISO timestamp) — prescription generation timestamp
  - `consultationData` (object) — snapshot of consultation data at generation time:
    - `consultationDate` — consultation date
    - `complaints` — chief complaints
    - `diagnosis` — diagnosis
    - `medications` (array) — medication list
    - `vitals` (object) — temperature, bpSystolic, bpDiastolic, pulse
  - `patientData` (object) — snapshot of patient data at generation time:
    - `name`, `dob`, `gender`, `contact`, `age` (calculated)
  - `prescriptionDate` (YYYY-MM-DD) — date the prescription is being written (defaults to today, user-editable)
  - `validityDays` (number) — prescription validity period in days (default: 5 from prescriptionConfig)
  - `notes` (text, optional) — additional physician notes on prescription

  Includes validation:
  - Required fields: consultationId, patientId, generatedBy, consultationData (must have at least 1 medication)
  - Must have at least one medication in consultationData.medications array
  - Throws error if consultation has zero medications
  - Validates that consultation and patient data are not empty
  - Format validation: dates are valid, timestamps are ISO format
  - generatedBy must be non-empty string (physician name)

- **Files changed:**
  - `frontend/js/models/prescription.js` (new file)

- **Risks:**
  - Data snapshot may be stale if consultation updated after prescription generated
  - No audit trail beyond generatedBy and generatedAt
  - No medication details (dosage, frequency) captured in consultation — prescription will only have med names
  - Referential integrity depends on F3 consultation data structure

- **Assumptions:**
  - Consultation data structure matches F3 (medications is array of strings, vitals object contains temperature, BP, pulse)
  - Patient data from F1 includes name, DOB, gender, contact
  - Prescription generated from complete consultation (all required vitals present)
  - One prescription per consultation generation call (can generate multiple times, each gets new ID)
  - Age calculated from DOB at generation time, not stored as immutable value

- **How to verify:**
  - Create prescription with valid consultation ID and patient data → no errors
  - Create prescription with consultation having zero medications → throws error
  - Create prescription with missing vitals → throws error
  - Verify snapshot includes all required patient and consultation data
  - Prescription ID is unique (UUID v4 format)
  - generatedAt timestamp in ISO format

---

**Step 3 — Create prescription generator utility module** (`frontend/js/services/prescriptionGenerator.js`)
- **What:** Core prescription generation engine:
  - `generatePrescription(consultationId, patientId, generatedBy, options = {})` — main function:
    - Loads consultation from F3 consultationStorage by consultationId
    - Validates consultation exists and belongs to specified patientId
    - Checks consultation has at least one medication (throws error if not)
    - Loads patient from F1 patientStorage by patientId
    - Validates patient exists
    - Creates new Prescription object with data snapshots from consultation and patient
    - Requires generatedBy parameter (physician name for audit/display)
    - Applies options overrides if provided (e.g., custom prescriptionDate, validityDays)
    - Returns populated Prescription object (does not auto-save; save is optional)
  - `validatePrescriptionData(consultationId, patientId)` — pre-generation validation:
    - Checks consultation exists and is valid
    - Checks consultation has at least one medication
    - Checks patient exists
    - Returns validation result: `{ isValid: boolean, errors: string[] }`
    - Used before generating to provide user feedback
    - Does not require generatedBy (validation pre-generation)
  - `getPrescriptionHTML(prescription)` — converts Prescription object to HTML markup:
    - (Note: implementation in Step 4; here we define contract)
    - Returns HTML string for prescription document
    - Uses prescriptionConfig to format output
  - Error handling:
    - Throws `PrescriptionGenerationError` with descriptive message if:
      - Consultation not found
      - Consultation has no medications
      - Patient not found
      - Consultation invalid state
    - Logs errors for debugging

- **Files changed:**
  - `frontend/js/services/prescriptionGenerator.js` (new file)

- **Risks:**
  - Consultation state changes between validation and generation (unlikely but possible)
  - Performance: loading consultation and patient data is synchronous (okay for localStorage)
  - No transaction safety: partial failure leaves app in unclear state
  - Circular dependency if consultationGenerator imports consultationStorage (design carefully)

- **Assumptions:**
  - F1 patientStorage and F3 consultationStorage modules are available globally
  - Consultation and patient data consistent and complete
  - Validation errors have clear, user-friendly messages
  - Prescription object created and optionally saved to prescriptionStorage (save via Step 5)
  - generatedBy passed from calling context (generate-prescription.html or prescription-generation page)

- **How to verify:**
  - Valid consultation ID + patient ID → Prescription object created successfully
  - Consultation with no medications → throws error with message "At least one medication required"
  - Invalid consultation ID → throws error "Consultation not found"
  - Invalid patient ID → throws error "Patient not found"
  - validatePrescriptionData with valid data → { isValid: true, errors: [] }
  - validatePrescriptionData with no medications → { isValid: false, errors: ["At least one medication required"] }
  - Generated prescription contains patient name, vitals, diagnosis, medications from source data

---

**Step 4 — Create prescription HTML/CSS formatter** (`frontend/js/formatters/prescriptionFormatter.js`)
- **What:** HTML and CSS formatting for printable prescription document:
  - `formatPrescriptionHTML(prescription, configOverrides = {})` — converts prescription object to HTML:
    - Generates complete HTML document (with <!DOCTYPE html> head, body)
    - Structure:
      1. **Header Section:**
         - "PRESCRIPTION" title centered, with date and prescription ID
      2. **Patient Information Block:**
         - Patient Name (bold)
         - Date of Birth and Age (calculated)
         - Gender, Contact Number
      3. **Physician Information Block:**
         - Physician/Doctor Name (from prescription.generatedBy)
         - Prescription generated date
         - Validity/Expiration date (generatedDate + validityDays)
      4. **Consultation Details Block:**
         - Consultation Date
         - Chief Complaints (if applicable, from config)
         - Diagnosis (if applicable, from config)
      5. **Vitals Section** (if configured to show):
         - Temperature, Systolic BP, Diastolic BP, Pulse
         - Formatted with units (°C, mmHg, bpm)
         - Display in table or list format
      6. **Medications Section:**
         - List or table of medications from prescription.consultationData.medications
         - Format per prescriptionConfig.medicationFormat ("list" or "table")
         - If table: columns for Medication Name, Dosage* (placeholder if not available), Frequency* (placeholder)
         - *Note: F3 only captures medication names, not dosage/frequency — prescription shows name only, with N/A for details
         - Physician can add these manually before printing if needed (optional enhancement)
      7. **Footer Section:**
         - Signature line with space for physician signature (if configured)
         - Prescription validity: "Valid until [expiration date]"
         - "Printed on: [current date/time]" if printed
    - All content wrapped in Bootstrap-compatible div structure (no external CSS dependency)
  - `getEmbeddedCSS()` — returns CSS string for prescription styling:
    - Print-friendly styles (A4 page size, margins, page breaks)
    - Prescription header styling (bold, centered)
    - Table styling for vitals/medications
    - Dark text, clear spacing
    - Hide irrelevant UI elements when printing (@media print)
  - `formatDate(dateString, format)` — format dates for display (e.g., "YYYY-MM-DD" to "January 15, 2026")
  - `calculateExpirationDate(generatedDate, validityDays)` — calculate expiration date
  - Error handling: logs if prescription data incomplete; uses fallback values (e.g., "Unknown Patient" if name missing)

- **Files changed:**
  - `frontend/js/formatters/prescriptionFormatter.js` (new file)
  - Optionally: `frontend/css/print.css` (new file) for print-specific styles

- **Risks:**
  - HTML/CSS complexity for print-friendly output
  - Print layout varies by browser/printer (responsive design challenging)
  - Medications table empty Dosage/Frequency columns confusing (needs clear labeling as "N/A" or footnote)
  - Page break handling for long medication lists
  - Bootstrap CSS loaded in print (may need !important overrides)

- **Assumptions:**
  - Prescription HTML embedded with inline styles (no external CSS required for portability)
  - Patient data from F1 includes name, DOB, gender, contact (all present and non-null)
  - Consultation data includes vitals with correct units (°C, mmHg, bpm)
  - Medications list may be long (10+ items); formatting should handle gracefully
  - Print output used primarily on A4 paper (portrait orientation default)
  - Physician name (generatedBy) included on prescription for identification
  - Prescription includes auto-calculated expiration date based on validityDays

- **How to verify:**
  - Generate prescription HTML → contains clinic name, patient name, all vitals, medications
  - Render HTML in browser → professional, readable format with clear sections
  - Apply print styles → page breaks correctly, margins appropriate, text readable
  - Print to PDF → document preserves formatting (test in Chrome, Firefox)
  - Long medication list (15+ items) → pagination/page break handled gracefully
  - Missing data (e.g., complaints) → section omitted or shown as "N/A" per config
  - Browser print preview → layout matches rendered output

---

**Step 5 — Create prescription storage utility** (`frontend/js/storage/prescriptionStorage.js`) **[REQUIRED FOR MVP]**
- **What:** Persistent storage for generated prescriptions (for history/audit trail and prescription retrieval):
  - `savePrescription(prescriptionObject)` — save prescription to localStorage
    - Uses key: `prescriptions`
    - Serializes prescription JSON
    - Returns prescription ID (already set in object)
    - localStorage key format: array under `prescriptions` key
  - `loadPrescription(prescriptionId)` — retrieve single prescription by ID
  - `getPrescriptionsByConsultationId(consultationId)` — get all prescriptions for a consultation (allow multiple generations)
  - `getPrescriptionsByPatientId(patientId)` — get all prescriptions for a patient
  - `getAllPrescriptions()` — retrieve all prescriptions (for audit/history view)
  - `deletePrescription(prescriptionId)` — soft delete prescription via status flag (preserves audit trail)

  Note: **Prescriptions stored in localStorage for history view and audit trail (REQUIRED for MVP per decision)**

- **Files changed:**
  - `frontend/js/storage/prescriptionStorage.js` (new file)

- **Risks:**
  - Storage increases localStorage usage (5-10MB total limit)
  - Stale data: prescription snapshots differ from current patient/consultation (but intentional for audit trail)
  - No automatic cleanup; prescriptions accumulate over time

- **Assumptions:**
  - Prescription is immutable once saved (audit trail)
  - Soft delete only (no hard delete) to preserve audit trail
  - Prescriptions stored in separate localStorage key: `prescriptions`
  - Each prescription can be linked to prescription history view (Step 8)

- **How to verify:**
  - Generate prescription → call savePrescription() → prescription stored in localStorage
  - Load prescription by ID → exact copy retrieved
  - Filter by consultationId → all prescriptions for consultation returned
  - Filter by patientId → all prescriptions for patient returned
  - Reload browser → prescriptions persist in localStorage
  - Delete prescription → soft delete via status flag (remains in storage)

---

### Phase 2: Prescription View & Display

**Step 6 — Create Prescription Display view** (`frontend/html/generate-prescription.html`)
- **What:** Page showing prescription preview with print/save options:
  - Gets consultation ID from URL parameter (`?consultationId=<consultationId>`)
  - Physician Name input section (REQUIRED):
    - Text input field labeled "Physician/Doctor Name" — required before generating prescription
    - Placeholder: "Dr. Smith" or "Enter your name"
    - User enters name (no auto-population; explicit input for flexibility)
  - Validation section (shown while prescription being generated):
    - Loading indicator while prescription being generated
    - Error message if consultation invalid or has no medications
    - "Back" button to return to previous page
  - Prescription preview section (shown if valid):
    - Full prescription HTML/preview displayed (from prescriptionFormatter)
    - Non-editable display (read-only)
    - Physician name displayed on prescription
    - Buttons at bottom:
      - "Print" — trigger browser print dialog
      - "Back to Consultation" — return to view-consultation.html
      - "Close" — close modal or return
  - Error handling:
    - If physician name empty: show error "Please enter physician name before generating prescription"
    - If consultation has no medications: show error "This consultation has no medications. Please add medications before generating a prescription."
    - If consultation not found: show error "Consultation not found"
    - If patient not found: show error "Patient data unavailable"
  - Print-friendly: CSS hides buttons, form controls, and page controls when printing

- **Files changed:**
  - `frontend/html/generate-prescription.html` (new file)

- **Risks:**
  - URL parameter must be valid consultation ID (no validation in HTML)
  - Print dialog may differ by browser/OS
  - Error messages may not be clear to physician
  - Page load delays if consultation data large
  - Physician name prompt may be skipped/empty if not required

- **Assumptions:**
  - Consultation ID provided in URL query string (set by calling page)
  - Consultation already saved (not draft)
  - Print functionality handled by browser native print dialog
  - PDF download via browser print-to-PDF (no external library)
  - Prescription display is read-only; no editing on this page
  - Physician name required and prompted on prescription generation page

- **How to verify:**
  - Valid consultation ID → prescription preview displayed
  - Invalid/missing consultation ID → error message shown
  - Empty physician name → error message blocks prescription generation
  - Valid physician name entered → prescription generated with name included
  - Print button → browser print dialog opens
  - Print preview → prescription formatted correctly, buttons hidden
  - Back button → returns to previous page/consultation view
  - All patient, vital, medication data displayed accurately
  - Physician name visible on printed prescription

---

**Step 7 — Create prescription generation & display handler** (`frontend/js/handlers/prescriptionHandler.js`)
- **What:** JavaScript handler for prescription view page:
  - On page load:
    - Extract consultationId from URL parameter
    - Display physician name input field (focus on it to require user input)
    - Do NOT auto-populate or prompt yet
  - On "Generate Prescription" button click:
    - Get physician name from input field
    - Validate physician name is non-empty (throw error if empty)
    - Call `prescriptionGenerator.validatePrescriptionData(consultationId, patientId)`
      - patientId retrieved from consultation (assume patientId in URL or loaded from consultation)
    - If validation fails: display error message, hide preview section
    - If validation succeeds: call `prescriptionGenerator.generatePrescription(consultationId, patientId, physicianName)`
    - Call `prescriptionStorage.savePrescription(prescription)` to persist prescription
    - Call `prescriptionFormatter.formatPrescriptionHTML(prescription)` to get HTML
    - Call `prescriptionFormatter.getEmbeddedCSS()` to get CSS
    - Insert prescription HTML + CSS into preview container (innerHTML)
  - On "Print" button click:
    - Ensure prescription HTML rendered
    - Call window.print()
  - On "Back" button click:
    - Navigate back to referrer or consultation view page
  - Error handling:
    - Catch prescriptionGenerator errors
    - Display user-friendly error messages
    - Log errors to console for debugging

- **Files changed:**
  - `frontend/js/handlers/prescriptionHandler.js` (new file)

- **Risks:**
  - Async load of consultation data may cause flicker or delay
  - Error handling must prevent blank/broken display
  - Browser print behavior varies (font sizes, margins differ)
  - prescriptionStorage may not be available (should fail gracefully)

- **Assumptions:**
  - consultationId reliably extracted from URL (or error handling catches missing)
  - consultationStorage, patientStorage, and prescriptionStorage available globally
  - Browser print() supported (all modern browsers)
  - Physician name obtained from form input or session (auto-populated)

- **How to verify:**
  - Page loads with valid consultationId → prescription preview displayed within 2 seconds
  - Page loads with invalid consultationId → error message displays
  - Prescription saved to prescriptionStorage (verify in localStorage)
  - Print button → print dialog opens with prescription content
  - Printed/saved as PDF → formatting preserved, all data visible
  - Reload page → prescription retrievable from storage by ID

---

### Phase 3: Integration with Consultation Views

**Step 8 — Add "Generate Prescription" button to View Consultation** (modify `frontend/html/view-consultation.html`)
- **What:**
  - On view-consultation.html page (from F3):
  - Add "Generate Prescription" button near top of page or in actions section
  - Button styling: primary/info button (Bootstrap "btn-primary" or similar)
  - Button enabled if consultation has at least one medication
  - Button disabled with tooltip "No medications. Add medications before generating prescription." if zero medications
  - On click: navigate to generate-prescription.html?consultationId=[id]&patientId=[patientId]

- **Files changed:**
  - `frontend/html/view-consultation.html` (modified, add button and script)

- **Risks:**
  - If consultation reloaded and medications removed, button state may be inconsistent
  - User confusion if button disabled (needs clear explanation)

- **Assumptions:**
  - Consultation loaded before button state determined
  - Medication validation done server-side in prescription generator (button is UX hint only)
  - Consultation ID available in page scope

- **How to verify:**
  - Consultation with medications → "Generate Prescription" button visible and enabled
  - Consultation with no medications → button disabled with tooltip
  - Click button → navigates to prescription generation page with correct consultationId

---

**Step 9 — Add prescription button handler to View Consultation** (modify `frontend/js/viewConsultation.js`)
- **What:**
  - Update viewConsultation.js to include prescription button handler:
  - On page load: after loading consultation data, check if medications array is non-empty
  - If medications.length > 0: enable "Generate Prescription" button
  - If medications.length === 0: disable button, set title/tooltip "No medications"
  - On button click: navigate to `generate-prescription.html?consultationId=${consultationId}`
  - Optional: show success message after prescription generated (if storing prescriptions per Step 5)

- **Files changed:**
  - `frontend/js/viewConsultation.js` (modified, add button state management and click handler)

- **Risks:**
  - Button state depends on consultation data load completion
  - Medications array may change without page reload (unlikely in MVP)

- **Assumptions:**
  - Consultation object has medications field as array
  - consultationId available in page scope or from URL

- **How to verify:**
  - Load consultation → button state correct based on medication count
  - Medications present → button clickable, navigates to prescription page
  - No medications → button disabled, tooltip displays
  - Prescription URL includes consultationId parameter

---

**Step 10 — Add "Generate Prescription" button to Edit Consultation** (modify `frontend/html/edit-consultation.html`) **[SKIPPED]**
- **What:**
  - SKIPPED for MVP: Prescription generation available only from view-consultation page (post-save)
  - Reason: Prevent confusion about prescription generation timing and outdated prescriptions

- **Files changed:**
  - None (skip this step)

- **How to verify:**
  - Edit consultation page does NOT have "Generate Prescription" button
  - Only view-consultation page has the button

---

### Phase 4: External Dependencies & Enhancements

**Step 11 — Skip PDF download library** **[SKIPPED]**
- **What:**
  - SKIPPED: No external PDF library integration (html2pdf.js not included)
  - Reason: Browser print-to-PDF sufficient for MVP
  - Users can print prescription via browser print dialog (Ctrl+P) and save as PDF

- **Files changed:**
  - None (skip this step)

- **How to verify:**
  - No html2pdf.js dependency in prescription page
  - Print dialog available via browser native print (Ctrl+P)
  - Users can save to PDF via print dialog

---

**Step 12 — Add prescription history view** (create `frontend/html/prescription-history.html`) **[REQUIRED]**
- **What:**
  - Prescription history view: access all prescriptions generated for a patient
  - Requires Step 5 (prescription storage) to be implemented
  - Accessed via direct link from consultation view (not from patient profile per decision)
  - Shows table of generated prescriptions with:
    - Prescription ID, Prescription Date, Physician Name, Consultation Link, Medication Count, Actions (View Prescription)
    - **Consultation Link:** Shows "View Consultation" link with consultation ID → opens consultation view
    - Allows tracing prescription back to source consultation for full audit trail
  - Table sorted by generation date descending (most recent first)
  - "View Prescription" button opens read-only prescription display (view current prescription from storage)
  - Optional: "Compare with Consultation" link → shows if consultation has been edited since prescription generated
  - Empty state: "No prescriptions found for this patient"
  - "Back to Consultation" or "Back" button → returns to referring page

- **Files changed:**
  - `frontend/html/prescription-history.html` (new file)
  - `frontend/js/prescriptionHistoryView.js` (new file)

- **Risks:**
  - Large number of prescriptions for patient may slow rendering (no pagination)
  - Patient ID must be valid and provided in URL
  - Prescription storage may be unavailable
  - Consultation may be deleted while prescription remains (orphaned reference)

- **Assumptions:**
  - MVP INCLUDES prescription history (required per user decision)
  - Prescription storage (Step 5) implemented and functional
  - Patient ID provided in URL query string (or from consultation context)
  - Prescriptions sorted by generation date descending
  - Consultation link provides traceability (audit trail requirement per decision)
  - Deleted consultations handled gracefully (show "Consultation not found" instead of link)

- **How to verify:**
  - Patient with prescriptions → history page displays all prescriptions with consultation links
  - Patient with no prescriptions → empty state message
  - Prescriptions sorted by generation date (most recent first)
  - Consultation link → navigates to consultation view correctly
  - View Prescription button → opens read-only prescription display
  - Orphaned prescription (consultation deleted) → shows "Consultation not found" instead of link
  - Reload page → prescriptions persist from localStorage

---

### Phase 5: Validation & Error Handling

**Step 13 — Create prescription error handler/validator** (modify `frontend/js/services/prescriptionGenerator.js`)
- **What:**
  - Comprehensive error handling in prescriptionGenerator:
  - Custom error class: `PrescriptionGenerationError` with:
    - `code` (enum: "NO_MEDICATIONS", "CONSULTATION_NOT_FOUND", "PATIENT_NOT_FOUND", "INVALID_DATA", "UNKNOWN")
    - `message` (user-friendly error description)
    - `details` (technical details for logging)
  - Validation error messages clear and actionable:
    - "No medications found in consultation. Add at least one medication before generating prescription."
    - "Consultation not found. Please select a valid consultation."
    - "Patient data unavailable. Ensure patient profile is complete."
    - "Consultation data incomplete. Ensure all vitals are recorded."
  - Error logging: log to console with timestamp and context

- **Files changed:**
  - `frontend/js/services/prescriptionGenerator.js` (modified, add error class and improve error messages)

- **Risks:**
  - Error messages must be clear (technical vs. user-friendly distinction)
  - Error logging may expose sensitive data (sanitize before logging)

- **Assumptions:**
  - Errors handled gracefully in prescriptionHandler (display to user)
  - Technical details logged for debugging, not shown to user

- **How to verify:**
  - Test each error scenario (no medications, missing consultation, etc.)
  - Error messages display clearly in UI
  - Console logs contain technical details for debugging

---

**Step 14 — Add print preview validation** (add to `frontend/html/generate-prescription.html`)
- **What:**
  - Before allowing print, validate prescription HTML rendered correctly:
  - CSS loads successfully
  - All sections rendered (header, patient, vitals, medications, footer)
  - No missing or truncated data
  - Optional: show "Print Preview" mode highlighting sections
  - If validation fails: show error "Prescription not ready for printing. Please refresh and try again."

- **Files changed:**
  - `frontend/html/generate-prescription.html` (add validation checks)
  - `frontend/js/handlers/prescriptionHandler.js` (add print validation)

- **Risks:**
  - Validation complexity may delay print (performance trade-off)
  - False positives (think CSS not loaded but actually is)

- **Assumptions:**
  - MVP may skip detailed validation (assume HTML renders correctly)
  - Simple check: verify prescription container not empty before print

- **How to verify:**
  - Print button → prescription preview fully rendered
  - Print output → all data visible and correct

---

### Phase 6: Testing & Verification

**Step 15 — Create prescription generation test cases** (document in `specs/F4_Prescription_Generation.md` or separate test file)
- **What:** Comprehensive test scenarios for prescription generation:
  - **Happy path:**
    - Generate prescription from consultation with 1 medication ✓
    - Generate prescription from consultation with 5+ medications ✓
    - Print prescription ✓
    - Download as PDF ✓
  - **Validation:**
    - Attempt prescription generation with zero medications → error ✓
    - Attempt prescription generation with invalid consultationId → error ✓
    - Attempt prescription generation with missing patient data → error ✓
  - **Data integrity:**
    - Prescription contains all vitals (temperature, BP systolic, BP diastolic, pulse) ✓
    - Prescription contains patient name, DOB, gender, contact ✓
    - Prescription contains all medications from consultation ✓
    - Prescription includes consultation date and diagnosis ✓
  - **UI/UX:**
    - Generate Prescription button visible on view-consultation.html ✓
    - Button disabled if no medications ✓
    - Prescription preview renders within 2 seconds ✓
    - Print dialog opens without errors ✓
    - Back button navigates correctly ✓
  - **Edge cases:**
    - Very long patient name (50+ characters) → prescription formats correctly ✓
    - Medication names with special characters → print correctly ✓
    - Long medication list (20+ items) → page breaks handled ✓
    - Prescription generated multiple times for same consultation → each has unique ID ✓
    - Browser back button after generating prescription → doesn't break state ✓

- **Files changed:**
  - Test case documentation (separate file or comments in code)

- **Risks:**
  - Manual testing required (no automated test framework in MVP)
  - Cross-browser testing needed (print behavior varies)

- **Assumptions:**
  - Test cases executed by developer/QA before release
  - Print output verified manually

- **How to verify:**
  - All test cases executed and passing
  - Documentation stored in workspace for reference

---

## Summary: Files to Create/Modify

### New Files (Phase 1-2):
1. `frontend/js/config/prescriptionConfig.js` — format configuration (minimal, simplified)
2. `frontend/js/models/prescription.js` — prescription data model
3. `frontend/js/services/prescriptionGenerator.js` — prescription generation engine
4. `frontend/js/formatters/prescriptionFormatter.js` — HTML/CSS formatting
5. `frontend/js/storage/prescriptionStorage.js` — prescription storage (REQUIRED for history)
6. `frontend/html/generate-prescription.html` — prescription view page
7. `frontend/js/handlers/prescriptionHandler.js` — page handler
8. `frontend/html/prescription-history.html` — prescription history view (REQUIRED)
9. `frontend/js/prescriptionHistoryView.js` — history view loader (REQUIRED)

### Modified Files (Phase 3):
1. `frontend/html/view-consultation.html` — add "Generate Prescription" button
2. `frontend/js/viewConsultation.js` — add button handler and state management
3. `frontend/html/view-patient.html` — add "View Prescription History" link (optional)
4. `frontend/js/viewPatient.js` — add history navigation handler (optional)

---

## Implementation Sequence

### Recommended Order (Minimum Viable Product):
1. **Step 1-2:** Config + Prescription Model (foundation)
2. **Step 3:** Prescription Generator (core logic)
3. **Step 4:** Formatter (HTML generation)
4. **Step 5:** Prescription Storage (localStorage persistence, required for history)
5. **Step 6-7:** Prescription View + Handler (UI)
6. **Step 8-9:** Integration with View Consultation (button)
7. **Step 12:** Prescription History View (required for MVP)
8. **Step 13-14:** Error handling + validation (polish)
9. **Step 15:** Testing & verification (QA)

**Estimated Duration:** 3-4 days (per spec: 1-2 days, expanded for storage + history)
- Day 1: Steps 1-4 (foundation + generator + formatter)
- Day 2: Steps 5, 6-9 (storage + view + integration)
- Day 3: Step 12 (prescription history)
- Day 4: Steps 13-15 (error handling + testing)

---

## Key Assumptions & Design Decisions

### Architectural Assumptions:
1. **No Backend API:** All operations client-side using localStorage
2. **Prescription Storage:** Prescriptions persisted to localStorage for audit trail and history (required MVP)
3. **Stateless Generation:** Each prescription generation creates new prescription with unique ID (multiple per consultation allowed)
4. **Read-Only Display:** Prescription HTML is display-only; no in-browser editing before print
5. **Single Clinic:** Clinic configuration minimal/hardcoded (no admin panel)

### Business Logic Assumptions:
1. **Medication Validation:** At least one medication required (hard requirement per spec)
2. **Physician Name Required:** Prescription must include physician/doctor name for audit and display
3. **Data Immutability:** Prescription data snapshot (doesn't update if consultation edited after generation)
4. **Prescription Validity:** Default 5-day validity period; expiration date auto-calculated
5. **No Medication Details:** Consultation captures medication names only (no dosage/frequency)

### UI/UX Assumptions:
1. **Print-First Workflow:** Prescription designed for print; save-to-PDF via browser print dialog
2. **Browser Print Dialog:** Uses native browser print (Ctrl+P) for document output
3. **Navigation:** After prescription view, user navigates to history or back to consultation
4. **Button Placement:** "Generate Prescription" on view-consultation page (post-save only)
5. **History Access:** Prescription history accessible from consultation view

### Risk Mitigation:
1. **Medication Requirement:** Validated at model level, button disabled on UI, error message in handler
2. **Data Integrity:** Snapshot preserves consultation state at generation time (prevents stale data)
3. **Print Compatibility:** CSS includes print-specific styles (@media print); tested on major browsers
4. **Error Recovery:** All errors display user-friendly messages; user can retry or modify consultation

---

## Relevant Files — Complete List

### New Files to Create (9 files):

**Phase 1 — Foundation & Data Model:**
1. `frontend/js/config/prescriptionConfig.js` — Prescription formatting configuration
2. `frontend/js/models/prescription.js` — Prescription data model and validation
3. `frontend/js/services/prescriptionGenerator.js` — Prescription generation engine with validation
4. `frontend/js/formatters/prescriptionFormatter.js` — HTML/CSS formatter for prescription output
5. `frontend/js/storage/prescriptionStorage.js` — localStorage persistence for prescriptions

**Phase 2 — Prescription View & Display:**
6. `frontend/html/generate-prescription.html` — Prescription preview and print page
7. `frontend/js/handlers/prescriptionHandler.js` — Event handler for prescription page

**Phase 4 — Prescription History & Enhancements:**
8. `frontend/html/prescription-history.html` — Prescription history view page (REQUIRED for MVP)
9. `frontend/js/prescriptionHistoryView.js` — Prescription history page controller (REQUIRED for MVP)

### Modified Files (2 files):

**Phase 3 — Integration with Consultation Views:**
1. `frontend/html/view-consultation.html` — Add "Generate Prescription" button to consultation view
2. `frontend/js/viewConsultation.js` — Add button state management and click handler

---

## Implementation Sequence

### Recommended Order (Minimum Viable Product):

**Day 1 — Foundation:**
- Step 1: Config + Prescription Model (foundation)
- Step 2: Prescription Data Model (data structure)
- Step 3: Prescription Generator (core logic)
- Step 4: Formatter (HTML generation)
- Step 5: Prescription Storage (localStorage persistence, **REQUIRED**)

**Day 2 — View & Integration:**
- Step 6: Prescription View (UI)
- Step 7: Prescription Handler (page logic)
- Step 8-9: Integration with View Consultation (button + handler)

**Day 3 — History & Enhancements:**
- Step 10: Prescription History View (REQUIRED for MVP)
- Step 11-12: Error handling + print validation (polish)

**Day 4 — Testing:**
- Step 13: Verification & test cases (QA)

**Estimated Duration:** 3-4 days
- Day 1: Steps 1-5 (foundation + storage)
- Day 2: Steps 6-9 (view + integration)
- Day 3: Steps 10-12 (history + error handling)
- Day 4: Step 13 (testing)

---

## Verification Checklist (Before Implementation)

### Pre-Implementation Validation:
- [x] F1 patient storage available and functional
- [x] F3 consultation storage available with vitals and medications
- [x] localStorage module patterns match F1/F3 conventions
- [x] Bootstrap CSS version compatible across pages
- [x] Browser print API supported (all modern browsers)

### Requirements Covered:
- [x] Prescription storage for audit trail and history (REQUIRED for MVP)
- [x] Prescription history view included (REQUIRED for MVP)
- [x] 5-day default validity period
- [x] Physician name captured and displayed on prescription
- [x] Browser print-to-PDF sufficient (no external library)
- [x] Simplified clinic configuration (hardcoded, no admin panel)
- [x] Medication validation (at least 1 required)
- [x] Consultation traceability (history shows source consultation link)

### Design Decisions Finalized:
- [x] Physician Name Input: User enters on generation page
- [x] Patient Profile Link: No prescription history button on patient profile
- [x] Consultation Link: Yes, prescription history shows source consultation for audit trail
- [x] Medication Details: Names only (no dosage/frequency)
- [x] PDF Export: Browser print-to-PDF (no html2pdf.js)
- [x] Prescription Persistence: localStorage required for MVP

---

## Plan Status

✅ **REFACTORED & READY FOR IMPLEMENTATION**

**All design decisions finalized. No further questions needed.**

**Key Improvements in This Refactoring:**
1. ✅ Fixed incomplete/corrupted sections
2. ✅ Added explicit Dependencies & Integration Points section
3. ✅ Consolidated Key Design Decisions at top
4. ✅ Reorganized phases logically (moved storage to Phase 1)
5. ✅ Added complete "Relevant Files" summary with file paths
6. ✅ Added clear Implementation Sequence with timeline
7. ✅ Added Pre-Implementation Verification Checklist
8. ✅ Consolidated duplicate Decisions sections
9. ✅ Removed vague/incomplete sections

**Next Step:** Begin implementation using the finalized, refactored plan.
