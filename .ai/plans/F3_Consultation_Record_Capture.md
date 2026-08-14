# Plan: F3 — Consultation Record Capture

## Source
**Reference:** [specs/features/PatientManagement.feature.md](../../specs/features/PatientManagement.feature.md) | F3 — Consultation Record Capture

**Spec Location:** [specs/F3_Consultation_Record_Capture.md](../../specs/F3_Consultation_Record_Capture.md)

---

**TL;DR:** Extend the patient management system with consultation record capture. Build consultation data model with mandatory vitals validation, storage utilities in localStorage, Add/Edit/View consultation forms with Bootstrap, and consultation linking to appointments from F2. Capture vitals (Temperature, Systolic BP, Diastolic BP, Pulse), complaints, diagnosis, and medications. All data stored in localStorage using JavaScript utilities.

---

## Implementation Steps

### Phase 1: Foundation & Data Model

**Step 1 — Create consultation storage utility module** (`frontend/js/storage/consultationStorage.js`)
- **What:** Functions for consultation CRUD operations:
  - `saveConsultation(consultationData)` — Save new consultation, return ID
  - `loadConsultation(consultationId)` — Retrieve single consultation
  - `updateConsultation(consultationId, updatedData)` — Update existing consultation
  - `deleteConsultation(consultationId)` — Delete consultation (soft delete via status)
  - `getAllConsultations()` — Retrieve all consultations
  - `getConsultationsByPatientId(patientId)` — Filter consultations by patient
  - `getConsultationsByAppointmentId(appointmentId)` — Filter consultations by appointment
  - `getConsultationsByDate(date)` — Filter consultations by date (YYYY-MM-DD format)
  
  Serializes/deserializes consultation JSON objects to/from localStorage using separate key: `consultations`
  
- **Files changed:**
  - `frontend/js/storage/consultationStorage.js` (new file)
  
- **Risks:**
  - localStorage has 5-10MB limit; data loss if browser cache cleared
  - Soft deletes via status flag may not actually free storage
  - No server-side backup
  
- **Assumptions:**
  - F1 patient storage exists and is accessible
  - F2 appointment storage exists and is accessible
  - Consultation status field: "Draft" (unsaved), "Completed" (saved), "Cancelled" (soft delete)
  - Each consultation linked to one appointment (foreign key: appointmentId)
  
- **How to verify:**
  - Save consultation → reload page → data persists in localStorage
  - Retrieve consultation by ID, patientId, appointmentId → returns correct data
  - Update consultation → changes reflected in subsequent retrieves
  - GetConsultationsByDate filters correctly

---

**Step 2 — Create consultation data model** (`frontend/js/models/consultation.js`)
- **What:** Consultation class with fields:
  - `id` (UUID v4) — unique identifier
  - `patientId` (UUID v4) — reference to F1 patient (required)
  - `appointmentId` (UUID v4) — reference to F2 appointment (required; must be from same patient)
  - **Vitals (all mandatory):**
    - `temperature` (numeric, 35.0-42.0°C) — body temperature
    - `bpSystolic` (numeric, 70-200 mmHg) — systolic blood pressure
    - `bpDiastolic` (numeric, 40-130 mmHg) — diastolic blood pressure
    - `pulse` (numeric, 40-200 bpm) — heart rate
  - `complaints` (text, optional) — patient's chief complaint(s)
  - `diagnosis` (text, optional) — physician's diagnosis
  - `medications` (array of strings, optional) — medication names only
  - `status` ("Completed" or "Cancelled") — consultation state
  - `createdAt` (ISO timestamp) — creation date
  - `updatedAt` (ISO timestamp) — last modification date
  - `consultationDate` (YYYY-MM-DD) — date of consultation (defaults to today or appointment date)
  
  Includes validation logic:
  - Required fields: patientId, appointmentId, temperature, bpSystolic, bpDiastolic, pulse
  - Validation ranges:
    - Temperature: 35.0 ≤ temp ≤ 42.0°C
    - Systolic BP: 70 ≤ systolic ≤ 200 mmHg
    - Diastolic BP: 40 ≤ diastolic ≤ 130 mmHg, and diastolic ≤ systolic
    - Pulse: 40 ≤ pulse ≤ 200 bpm
  - Appointment ID validation: must exist in F2 storage and belong to same patient
  - Format validation: complaints and diagnosis are text; medications is array of strings
  
- **Files changed:**
  - `frontend/js/models/consultation.js` (new file)
  
- **Risks:**
  - Manual validation required (no framework); edge cases may be missed
  - Vital range validation may reject legitimate outliers (physician override not built in)
  - Referential integrity (appointment must exist) not enforced at model level
  
- **Assumptions:**
  - Vital signs in metric units (Celsius, mmHg, bpm); no unit conversion needed
  - Systolic BP always ≥ diastolic BP (physiologically correct)
  - Appointment ID provided must exist and belong to same patient (business logic validation)
  
- **How to verify:**
  - Create valid consultation with all mandatory vitals → no validation errors
  - Temperature 34°C (below range) → throws error
  - Pulse 250 bpm (above range) → throws error
  - Missing any mandatory vital → throws error
  - Valid appointment ID → object created successfully
  - Invalid/missing appointment ID → throws error or handled gracefully

---

**Step 3 — Create consultation appointment validator helper** (`frontend/js/validators/appointmentValidator.js`)
- **What:** Helper function to validate appointment eligibility for consultation:
  - `validateAppointmentForConsultation(appointmentId, patientId)` — Verifies:
    - Appointment exists in F2 storage
    - Appointment belongs to specified patient (patientId matches)
    - Appointment has status "Scheduled" or "Completed" (not "Cancelled")
    - Returns true if valid, false otherwise
    - Returns error message describing why appointment is ineligible
  
  Used during form submission and edit operations to ensure appointment is valid before saving consultation.
  
- **Files changed:**
  - `frontend/js/validators/appointmentValidator.js` (new file)
  
- **Risks:**
  - If F2 appointment deleted while consultation edit in progress, validation will fail
  - Cancelled appointments cannot have consultations (business rule assumption)
  
- **Assumptions:**
  - F2 appointmentStorage module is available globally
  - Appointment status must be "Scheduled" or "Completed", not "Cancelled"
  - Validating before form load to prevent user entering data for invalid appointment
  
- **How to verify:**
  - Valid appointment ID + matching patient → returns true
  - Cancelled appointment → returns false with error message
  - Deleted appointment → returns false with error message
  - Wrong patient ID → returns false with error message

---

### Phase 2: Consultation Forms & UI

**Step 4 — Create Add Consultation form HTML** (`frontend/html/add-consultation.html`)
- **What:** Bootstrap form with fields:
  - Appointment Selector (dropdown showing available appointments for selecting patient)
    - Loads appointments from F2 storage with status "Scheduled" or "Completed"
    - Displays: "Patient Name - Date Time" format
    - Required field; on selection, displays patient name and appointment date/time
  - Vitals Section (readonly display of selected appointment details):
    - Appointment date and time (readonly)
    - Patient name (readonly, retrieved from F1 patient storage)
  - Mandatory Vitals Input:
    - Temperature (°C) — numeric input, placeholder "36.5", tooltip "35.0-42.0°C"
    - Systolic BP (mmHg) — numeric input, placeholder "120"
    - Diastolic BP (mmHg) — numeric input, placeholder "80"
    - Pulse (bpm) — numeric input, placeholder "72", range validation indicator
  - Optional Fields:
    - Complaints (textarea) — patient's chief complaint(s)
    - Diagnosis (textarea) — physician's diagnosis
    - Medications (list interface)
      - Text input to add medication name
      - "Add Medication" button → appends to list below
      - List displays medications with "Remove" button for each
      - Initially empty
  - Buttons:
    - "Save Consultation" → calls validation handler
    - "Cancel" → returns to daily schedule or main page
  - Error Display Area (initially hidden, shown if validation fails)
    - Displays validation errors for each failed field in red alert

- **Files changed:**
  - `frontend/html/add-consultation.html` (new file)

- **Risks:**
  - Appointment dropdown may be slow/empty if no appointments exist
  - User may not understand vital ranges; needs clear guidance (tooltips)
  - Medications interface requires JavaScript handling (add/remove dynamically)
  - Date picker and appointment selector UI interaction needs careful design

- **Assumptions:**
  - At least one appointment with status "Scheduled" or "Completed" exists
  - Bootstrap form styling consistent with F1/F2 forms
  - JavaScript will dynamically populate appointment dropdown on page load
  - Medications managed via JavaScript array manipulation in form handler

- **How to verify:**
  - Form renders with all fields visible
  - Appointment dropdown populates from F2 storage (non-empty)
  - Selecting appointment shows patient name and date/time readonly
  - Vitals fields accept numeric input with placeholders
  - "Add Medication" button works; medications appear in list
  - Remove button removes medication from list
  - Cancel button navigates back
  - Submit button present and enabled

---

**Step 5 — Create form validation & submission handler for Add Consultation** (`frontend/js/forms/addConsultationForm.js`)
- **What:**
  - On page load: populate appointment dropdown from F2 appointmentStorage
  - On appointment selection: retrieve and display patient name, appointment date/time
  - On form submit:
    - Validate all mandatory vitals present and within range (temp, BP systolic, BP diastolic, pulse)
    - Display validation errors inline (under each failed field)
    - If any error: prevent submit with error message
    - If valid: create consultation object via `Consultation` class
    - Validate appointment eligibility via appointmentValidator
    - If appointment invalid: show error, prevent submit
    - If all valid: save to localStorage via `consultationStorage.saveConsultation()`
    - Display success message: "Consultation saved successfully"
    - Redirect to daily schedule or consultations list view after 2-second delay
  - Handle double-submit: disable submit button on first click, re-enable after response

- **Files changed:**
  - `frontend/js/forms/addConsultationForm.js` (new file)

- **Risks:**
  - Vital range validation may be too strict; user feedback critical
  - Double-submit race condition; button disabling required
  - Appointment dropdown population may fail if F2 storage unavailable
  - Empty appointment list edge case (show helpful message)
  - localStorage write failures not handled

- **Assumptions:**
  - F1 patient storage and F2 appointment storage always available
  - Appointment date used as consultationDate if not explicitly set
  - On successful save, redirect to viewing consultations for selected patient or daily schedule

- **How to verify:**
  - Page load: appointment dropdown populated with available appointments
  - Select appointment: patient name and date/time appear
  - Submit with missing vital (e.g., no temperature) → error message blocks submission
  - Submit with vital out of range (temp 43°C) → error message explains range
  - Submit with valid data → success message displayed, consulted saved to localStorage
  - Submit button disabled during submission (no double-submit)
  - Verify consultation object in localStorage has all fields and correct values

---

**Step 6 — Create Edit Consultation form HTML** (`frontend/html/edit-consultation.html`)
- **What:** Same as add-consultation.html but:
  - Gets consultation ID from URL parameter (`?id=<consultationId>`)
  - On page load: pre-populate all fields with existing consultation data
  - Appointment field: readonly (cannot reassign consultation to different appointment after creation)
  - Patient name and appointment date/time: readonly
  - Vitals fields: editable, pre-filled with current values
  - Medications list: pre-populated with existing medications, still editable (add/remove)
  - Submit → updates consultation via full update
  - Back button → returns to consultation list or patient profile

- **Files changed:**
  - `frontend/html/edit-consultation.html` (new file)

- **Risks:**
  - Invalid consultation ID in URL → error handling required
  - Concurrent edit race conditions (no locking mechanism)
  - Readonly appointment field may confuse user (explain why not editable)
  - Pre-population failure if consultation not found

- **Assumptions:**
  - Consultation ID provided in URL query string
  - Appointment cannot be changed after consultation created (business rule)
  - Consultation can be edited unless status is "Cancelled"

- **How to verify:**
  - Valid consultation ID → form pre-fills with all data
  - Invalid/missing consultation ID → shows error message
  - Appointment field readonly (user cannot change)
  - Edit vitals to new values → updates successfully
  - Edit medications (add/remove) → saves correctly
  - Submit disabled during save to prevent double-submit

---

**Step 7 — Create edit consultation form handler** (`frontend/js/forms/editConsultationForm.js`)
- **What:**
  - Get consultation ID from URL parameter
  - Load consultation from consultationStorage
  - If not found: display error, show link to safe page
  - Pre-populate all form fields with consultation data (vitals, complaints, diagnosis, medications)
  - Keep appointment field and patient name readonly (display only)
  - On form submit:
    - Validate all mandatory vitals present and within range (same logic as add)
    - Display validation errors inline
    - If any error: prevent submit
    - If valid: update consultation via `consultationStorage.updateConsultation()`
    - Show success message and redirect
  - Handle medications list dynamically (add/remove via JavaScript)

- **Files changed:**
  - `frontend/js/forms/editConsultationForm.js` (new file)

- **Risks:**
  - Concurrent edit race conditions
  - localStorage update failures
  - Consultation not found or deleted while editing
  - User confusion about readonly appointment field

- **Assumptions:**
  - Consultation status can be edited (remains "Completed" unless explicitly cancelled)
  - Appointment cannot be reassigned (readonly)

- **How to verify:**
  - Load consultation with ID → all fields pre-fill correctly
  - Edit vitals to valid new values → save succeeds
  - Edit vitals to invalid values → validation error blocks save
  - Add medication → appears in list and saves
  - Remove medication → removed from list and saves
  - Reload page → edited data persists

---

### Phase 3: Consultation Views & List Management

**Step 8 — Create consultations list view** (`frontend/html/consultations-list.html`)
- **What:** Display of all consultations (or consultations for selected patient/date):
  - Filter options (optional, MVP may not include):
    - By patient (dropdown from F1)
    - By date range (date pickers)
  - Table/list of consultations:
    - Columns: Date, Patient Name, Complaints (truncated), Diagnosis (truncated), Temperature, Pulse, Status, Actions
    - Rows sorted by date descending (most recent first)
    - "View" button → opens view-consultation.html with consultation ID
    - "Edit" button → opens edit-consultation.html with consultation ID
    - "Cancel" button → soft delete (changes status to "Cancelled")
  - "Add Consultation" button → navigates to add-consultation.html
  - Empty state: "No consultations found" message

- **Files changed:**
  - `frontend/html/consultations-list.html` (new file)

- **Risks:**
  - Large number of consultations may make list slow to render
  - Patient name lookup from F1 storage may fail if patient deleted
  - No pagination (MVP scope)

- **Assumptions:**
  - Consultations sorted by date descending
  - "Completed" consultations visible; "Cancelled" shown with different styling
  - MVP may not include filter; can be added in enhancement

- **How to verify:**
  - Page loads and displays all consultations
  - Consultations sorted by date (most recent first)
  - Patient names display correctly via F1 lookup
  - View/Edit buttons navigate to correct pages with consultation ID
  - Empty state displays when no consultations exist

---

**Step 9 — Create consultations list loader & renderer** (`frontend/js/consultationsListView.js`)
- **What:**
  - Load all consultations from consultationStorage (or filter by patient/date if UI includes filters)
  - Sort by date descending
  - For each consultation: retrieve patient name from F1 storage by patientId
  - Render table/list with consultation data
  - Bind action buttons (View/Edit/Cancel) to handlers
  - Handle empty state
  - Handle patient lookup failures gracefully (show "Unknown Patient")

- **Files changed:**
  - `frontend/js/consultationsListView.js` (new file)

- **Risks:**
  - Performance degradation with 100+ consultations (no pagination)
  - Patient lookup failure if F1 storage corrupted or patient deleted
  - Missing consultation data (orphaned records)

- **Assumptions:**
  - Patient data always available in F1 storage (best effort; "Unknown Patient" fallback if not)
  - Date sorting reliable (assumes ISO date format)

- **How to verify:**
  - Load list with 0, 5, 20+ consultations → renders correctly
  - Verify date sorting (most recent first)
  - Patient names display by F1 lookup
  - View/Edit buttons have correct href with consultation ID
  - Empty state message displays when no consultations

---

**Step 10 — Create View Consultation (read-only) profile view** (`frontend/html/view-consultation.html`)
- **What:** Read-only display of single consultation record:
  - Gets consultation ID from URL parameter (`?id=<consultationId>`)
  - Displays all consultation data:
    - Patient name, appointment date/time (readonly)
    - All vitals: Temperature, Systolic BP, Diastolic BP, Pulse
    - Complaints, diagnosis, medications list
    - Consultation created/updated timestamps (optional)
  - Buttons:
    - "Edit" → opens edit-consultation.html
    - "Back" → returns to consultations list
    - "Cancel Consultation" (with confirmation dialog) → soft delete
  - No editable fields; display only

- **Files changed:**
  - `frontend/html/view-consultation.html` (new file)

- **Risks:**
  - Missing consultation ID → error handling required
  - Patient lookup failure → show "Unknown Patient"

- **Assumptions:**
  - Consultation ID provided in URL query string
  - Read-only view; all edits via separate edit page

- **How to verify:**
  - Valid consultation ID → displays all data correctly
  - Invalid/missing ID → shows error message
  - Patient name retrieved from F1 lookup
  - All vitals display with proper units (°C, mmHg, bpm)
  - Medications list displays with proper formatting
  - Edit button navigates to edit page
  - Back button navigates to list

---

**Step 11 — Create view consultation loader** (`frontend/js/viewConsultation.js`)
- **What:**
  - Get consultation ID from URL parameter
  - Load consultation from consultationStorage
  - Load patient data from F1 storage by patientId
  - Load appointment data from F2 storage by appointmentId
  - Populate HTML with consultation, patient, and appointment data
  - Handle missing data gracefully (show error or "Unknown")

- **Files changed:**
  - `frontend/js/viewConsultation.js` (new file)

- **Risks:**
  - Consultation not found → error message
  - Patient deleted while viewing consultation → "Unknown Patient"
  - Appointment deleted while viewing consultation → "Unknown Appointment"

- **Assumptions:**
  - Consultation data complete and consistent
  - F1 and F2 data may be partially missing; handle gracefully

- **How to verify:**
  - Valid consultation ID → displays all data
  - Invalid ID → error message displayed
  - Cross-reference data (patient, appointment) displayed correctly
  - Handle missing linked data gracefully (e.g., "Patient deleted")

---

**Step 12 — Add cancel/soft-delete consultation functionality** (modify `frontend/js/consultationsListView.js` and `frontend/js/viewConsultation.js`)
- **What:**
  - Cancel button displays confirmation dialog: "Cancel this consultation?"
  - On confirm: call `consultationStorage.updateConsultation(id, {status: 'Cancelled'})`
  - Update display to show "Cancelled" status (gray badge, strikethrough text, etc.)
  - Cancelled consultations remain in history but no longer count as active
  - No hard delete; soft delete via status update

- **Files changed:**
  - `frontend/js/consultationsListView.js` (modified to add cancel handler)
  - `frontend/js/viewConsultation.js` (modified to add cancel button handler)

- **Risks:**
  - Accidental cancellation (require user confirmation)
  - Cancelled consultation may still be linked to appointment; clarify workflow
  - localStorage update failure leaves UI inconsistent

- **Assumptions:**
  - Cancelled consultations remain in storage but not counted as active
  - Status change is final (no undo)

- **How to verify:**
  - Click Cancel → confirmation dialog appears
  - Confirm → consultation status changes to "Cancelled" in UI
  - Consultation still visible in list with "Cancelled" indicator
  - Reload page → status persists

---

### Phase 4: Patient Integration & Navigation

**Step 13 — Add consultation link to patient profile** (modify `frontend/html/view-patient.html` and `frontend/js/viewPatient.js`)
- **What:**
  - On View Patient profile page (from F1):
  - Add section: "Recent Consultations" or "View Consultations" button
  - Button links to consultations list filtered by this patient (new page or filtered view)
  - Alternatively, show recent consultation summary (last consultation's vitals, diagnosis)
  - Button/link to add new consultation for this patient

- **Files changed:**
  - `frontend/html/view-patient.html` (modified, add consultations section)
  - `frontend/js/viewPatient.js` (modified, load recent consultations for patient)

- **Risks:**
  - Referential integrity: consultations may exist for deleted patient
  - Added complexity to view-patient page
  - Consultation not linked to appointment (business logic clarification needed)

- **Assumptions:**
  - Can create consultation via patient profile (may default to selecting appointment first)
  - Recent consultations displayed; link to full history deferred to F5

- **How to verify:**
  - View patient profile → consultations section visible
  - "View Consultations" button navigates to consultations filtered by patient
  - "Add Consultation" button navigates to add-consultation form
  - Recent consultation data displayed correctly

---

**Step 14 — Create patient-specific consultations view** (`frontend/html/patient-consultations.html`)
- **What:** Display of all consultations for a specific patient:
  - Gets patient ID from URL parameter (`?patientId=<patientId>`)
  - Displays patient name and contact at top (from F1)
  - Table of consultations for this patient:
    - Columns: Date, Appointment Time, Complaints, Diagnosis, Temperature, Pulse, Actions (View/Edit)
    - Rows sorted by date descending
  - "Add Consultation" button → navigates to add-consultation.html
  - "Back to Patient" button → returns to view-patient.html
  - Empty state: "No consultations for this patient"

- **Files changed:**
  - `frontend/html/patient-consultations.html` (new file)

- **Risks:**
  - Patient ID may be invalid → error handling
  - Large number of consultations for patient → no pagination
  - Patient data may be deleted while viewing consultations

- **Assumptions:**
  - Patient ID provided in URL query string
  - Consultations filtered to only this patient
  - Most recent consultations displayed first

- **How to verify:**
  - Valid patient ID → patient name displayed, consultations listed
  - Invalid patient ID → error message
  - Consultations sorted by date descending
  - "Add Consultation" navigates to add form
  - "Back to Patient" navigates to patient profile

---

**Step 15 — Create patient consultations list loader** (`frontend/js/patientConsultationsView.js`)
- **What:**
  - Get patient ID from URL parameter
  - Load patient data from F1 storage
  - Load all consultations for this patient from consultationStorage via `getConsultationsByPatientId()`
  - Sort by date descending
  - For each consultation: retrieve appointment details from F2 storage
  - Render table with consultation and appointment data
  - Handle empty state and missing patient data

- **Files changed:**
  - `frontend/js/patientConsultationsView.js` (new file)

- **Risks:**
  - Patient not found → error message required
  - Appointment lookup failures → handle gracefully

- **Assumptions:**
  - Patient ID always present and valid (or error if not)
  - Consultations complete and referentially consistent

- **How to verify:**
  - Patient with consultations → list displays all, sorted by date
  - Patient with no consultations → empty state message
  - Invalid patient ID → error message
  - Appointment details displayed correctly for each consultation

---

### Phase 5: Appointment Integration & Linking

**Step 16 — Add consultation link to appointment** (modify `frontend/html/view-appointment.html`, if F2 includes this page, or `frontend/js/appointmentSchedule.js`)
- **What:**
  - On daily schedule view (F2) or appointment detail view:
  - Add "Add Consultation" button next to each appointment
  - Button navigates to add-consultation.html?appointmentId=<appointmentId>
  - Optionally show: "Consultation saved ✓" indicator if consultation already exists for appointment
  - Link to view/edit existing consultation if one exists

- **Files changed:**
  - `frontend/html/daily-schedule.html` (or equivalent F2 file) (modified, add consultation buttons)
  - `frontend/js/appointmentSchedule.js` (modified, detect if consultation exists for appointment)
  - Potentially new: `frontend/html/view-appointment.html` if not already in F2

- **Risks:**
  - Appointment may have multiple consultations (clarify: one-to-one or one-to-many?)
  - Business logic: can multiple consultations link to one appointment?
  - Implementation assumption: one consultation per appointment (business rule)

- **Assumptions:**
  - One consultation per appointment (one-to-one relationship)
  - When creating consultation, appointment ID pre-filled in form
  - Appointment can exist without consultation; consultation requires appointment

- **How to verify:**
  - Daily schedule displays "Add Consultation" button for each appointment
  - Click button → navigates to add-consultation.html with appointmentId pre-selected
  - If consultation exists for appointment → "View Consultation" or "Edit Consultation" shown instead
  - Links navigate to correct views

---

**Step 17 — Implement consultation-appointment linking validation** (modify `frontend/js/models/consultation.js` and validators)
- **What:**
  - Validate that appointment ID in consultation matches:
    - Appointment exists in F2 storage
    - Appointment status is "Scheduled" or "Completed" (not "Cancelled")
    - Appointment patient ID matches consultation patient ID
  - Prevent creating multiple consultations for same appointment (optional rule; clarify)
  - Error messages explaining why appointment is ineligible

- **Files changed:**
  - `frontend/js/models/consultation.js` (modified, add appointment validation to constructor)
  - `frontend/js/validators/appointmentValidator.js` (used by form handlers)

- **Risks:**
  - User attempts to create 2nd consultation for same appointment → error (unless one-to-many allowed)
  - Appointment deleted after consultation created → orphaned record

- **Assumptions:**
  - One consultation per appointment (one-to-one relationship)
  - Appointment must be valid and owned by same patient as consultation

- **How to verify:**
  - Create consultation with valid appointment → succeeds
  - Attempt to create 2nd consultation for same appointment → error (if one-to-one)
  - Create consultation with cancelled appointment → error
  - Create consultation with wrong patient's appointment → error

---

### Phase 6: Main Navigation & App Integration

**Step 18 — Add Consultations navigation to main app** (modify `frontend/html/index.html`)
- **What:** Update main landing page:
  - Add "Manage Consultations" link/button to consultations list view
  - Navigation menu includes: Patients, Appointments, Consultations, (Future: Prescriptions, History)
  - Maintain header/footer consistent with F1/F2 design

- **Files changed:**
  - `frontend/html/index.html` (modified, add consultations navigation)

- **Risks:**
  - Navigation structure may not scale (prepare for F4-F7)
  - Inconsistent styling if CSS not centralized

- **Assumptions:**
  - index.html exists from F1 with menu structure
  - Bootstrap CSS included globally
  - Consultations list is main entry point

- **How to verify:**
  - index.html renders with "Manage Consultations" link
  - Link navigates to consultations-list.html
  - All other F1/F2 links still work
  - Design consistent across all pages

---

### Phase 7: Styling & Polish

**Step 19 — Add consultation-specific CSS** (modify `frontend/css/styles.css`)
- **What:** Styles for:
  - Consultation form (vitals input validation indicators, error messages in red)
  - Vitals display (with units, formatted nicely)
  - Consultations table (columns well-spaced, status badges with colors)
  - Status badges (Completed=green, Cancelled=gray)
  - Medications list (styled as tags or items with remove buttons)
  - Validation error messages (red alert boxes under each field)
  - Success messages (green confirmation)
  - Readonly field styling (disabled appearance for appointment, patient name)
  - Tooltips for vital ranges (optional, nice-to-have)
  - Responsive design for mobile (if applicable)

- **Files changed:**
  - `frontend/css/styles.css` (modified, add consultation styles)

- **Risks:**
  - CSS conflicts with Bootstrap or F1/F2 styles
  - Mobile responsiveness may break
  - Vital range validation indicators unclear to user

- **Assumptions:**
  - Bootstrap CDN already included
  - F1/F2 styles established; consultation styles extend them
  - Color scheme: green=success, red=error, blue=info, gray=cancelled

- **How to verify:**
  - All consultation pages render with polished UI
  - Validation errors display clearly in red
  - Vitals display with proper formatting and units
  - Status badges color-coded correctly
  - Mobile view remains usable (if tested)
  - Consistent design across all consultation pages

---

### Phase 8: Testing & Validation

**Step 20 — Manual acceptance testing**
- **What:** Execute all test scenarios:
  
  **Scenario 1: Happy path — Create consultation successfully**
  - Precondition: At least one appointment with status "Scheduled" or "Completed" exists (from F2)
  - Navigate to "Add Consultation" → appointment dropdown shows available appointments
  - Select appointment → patient name and appointment date/time display
  - Fill vitals: Temperature 37.5°C, BP 120/80, Pulse 72
  - Fill optional fields: Complaints "Headache", Diagnosis "Mild migraine", Medication "Aspirin 500mg"
  - Click "Save Consultation" → form validates successfully
  - Consultation saved to localStorage and appears in consultations list
  - Patient profile shows recent consultation link
  - Appointment page shows "Consultation saved ✓" indicator
  - ✓ Acceptance Criteria Met

  **Scenario 2: Validation — Missing mandatory vitals**
  - Navigate to "Add Consultation"
  - Select appointment
  - Leave Temperature field empty
  - Click "Save Consultation" → validation error displays: "Temperature is required"
  - Submit button remains disabled; form does not submit
  - Fill Temperature, leave Pulse empty → submit → validation error "Pulse is required"
  - Fill Pulse with value 250 (above range) → submit → validation error "Pulse must be between 40-200 bpm"
  - Fill all vitals correctly → submit succeeds
  - ✓ Acceptance Criteria Met
  
  **Additional scenarios:**
  - Edit consultation: Select existing consultation → Edit → modify vitals → save → list shows updates ✓
  - Cancel consultation: Click Cancel on consultation detail → confirm → status changes to "Cancelled" ✓
  - View consultation history: Open patient profile → "View Consultations" → shows patient's consultations ✓
  - Verify vital ranges: Test boundary values (temp 35.0, 42.0; BP 70-200; Pulse 40-200) → accepted ✓
  - Verify out-of-range values: Temp 34.9, 42.1; BP 69, 201; Pulse 39, 201 → rejected with errors ✓
  - Medications handling: Add multiple medications → remove one → save → verify list persisted ✓
  - Empty consultations list: No consultations exist → "No consultations found" message displays ✓
  - Patient lookup: Delete patient from F1 → consultation still accessible → "Unknown Patient" displays gracefully ✓

- **Files affected:** All F3 files
- **Risks:**
  - Manual testing may miss edge cases
  - Browser differences in date/time picker behavior
  - Vital validation ranges may not match real-world medical norms

- **Assumptions:**
  - F1 patient data and F2 appointment data exist from prior testing
  - All HTML5 numeric inputs supported in target browser
  - localStorage data persists across page reloads

- **How to verify:**
  - Browser DevTools → Application → localStorage → verify consultation records with correct structure
  - Refresh page → consultation data persists
  - All vital range validations work correctly
  - All acceptance criteria from F3 spec pass (Scenario 1 & 2)
  - No console errors during testing
  - Patient profile shows consultation links correctly
  - Appointment detail shows consultation indicator

---

## Relevant Files Summary

### New Files (14 files)
1. `frontend/js/storage/consultationStorage.js` — Consultation localStorage CRUD operations
2. `frontend/js/models/consultation.js` — Consultation data model & validation
3. `frontend/js/validators/appointmentValidator.js` — Appointment eligibility validator
4. `frontend/html/add-consultation.html` — Add consultation form
5. `frontend/js/forms/addConsultationForm.js` — Add consultation form handler
6. `frontend/html/edit-consultation.html` — Edit consultation form
7. `frontend/js/forms/editConsultationForm.js` — Edit consultation form handler
8. `frontend/html/consultations-list.html` — Consultations list view
9. `frontend/js/consultationsListView.js` — Consultations list loader & renderer
10. `frontend/html/view-consultation.html` — Single consultation detail view (read-only)
11. `frontend/js/viewConsultation.js` — Consultation detail view loader
12. `frontend/html/patient-consultations.html` — Patient-specific consultations view
13. `frontend/js/patientConsultationsView.js` — Patient consultations list loader
14. `frontend/css/styles.css` — (Enhanced with consultation styles, partial modification)

### Modified Files (4 files)
1. `frontend/html/index.html` — Add "Manage Consultations" navigation link
2. `frontend/html/view-patient.html` — Add "View Consultations" button/section
3. `frontend/js/viewPatient.js` — Load and display recent consultations for patient
4. `frontend/html/daily-schedule.html` (or F2 appointment view) — Add "Add Consultation" buttons per appointment
5. `frontend/css/styles.css` — Add consultation-specific styling

---

## Implementation Sequence (Recommended)

**Priority Order (to minimize blocking dependencies):**

1. **Step 1-3 (Foundation - 1 day):** Build storage utilities, data model, appointment validator
   - No dependencies; foundational
   - Enables all downstream work

2. **Step 4-7 (Consultation Forms - 1-2 days):** Build add/edit forms
   - Depends on Steps 1-3
   - Can be developed in parallel

3. **Step 8-12 (Views - 1 day):** Build consultations list, detail views, loaders
   - Depends on Steps 1-3 (not directly on forms)
   - Parallel development possible

4. **Step 13-17 (Integration - 1 day):** Link consultations to patients and appointments
   - Depends on Steps 1-12
   - Requires coordination with F1/F2 files

5. **Step 18-19 (Navigation & Polish - 0.5 days):** Add menu links, styling
   - Depends on all prior steps
   - Final touch

6. **Step 20 (Testing - 1 day):** Manual acceptance testing
   - Validates all prior steps
   - Final verification before completion

**Total Estimated Duration:** 3–5 days (consistent with spec estimate)

---

## Verification Steps Checklist

1. **Data Model** — Consultation objects have all 10 fields (id, patientId, appointmentId, temp, bpSystolic, bpDiastolic, pulse, complaints, diagnosis, medications, status, timestamps) ✓
2. **Vital Validation** — Temperature 35.0-42.0°C, BP 70-200 systolic / 40-130 diastolic, Pulse 40-200 bpm ✓
3. **localStorage Persistence** — Save consultation → reload page → data persists ✓
4. **Appointment Validation** — Consultation requires valid appointment of same patient ✓
5. **Add Consultation** — Valid vitals + appointment → saves and appears in list with status "Completed" ✓
6. **Validation Blocks Save** — Missing vitals (temp, BP, pulse) → error blocks submit ✓
7. **Vitals Out of Range** — Out-of-range values rejected with specific error messages ✓
8. **Consultations List** — All consultations display with patient names, vitals, complaints ✓
9. **View Consultation** — Click View → read-only detail of consultation ✓
10. **Edit Consultation** — Click Edit → pre-fill → modify vitals → save → list shows updates ✓
11. **Cancel Consultation** — Click Cancel → confirm → status changes to "Cancelled" ✓
12. **Patient Consultations** — View patient profile → "View Consultations" → shows only this patient's records ✓
13. **Appointment Integration** — Daily schedule shows "Add Consultation" button per appointment ✓
14. **One-to-One Linking** — Consultation linked to one appointment; appointment has at most one consultation ✓
15. **UI Consistency** — All pages match F1/F2 design & Bootstrap styling ✓
16. **Empty States** — No appointments → no consultation form; no consultations → "No consultations" message ✓
17. **Error Handling** — Missing patient/appointment → graceful error messages ✓
18. **Acceptance Criteria** — Both F3 spec scenarios pass (happy path + validation) ✓

---

## Key Decisions & Assumptions

### Consultation Model & Data Structure
- **Appointment Linking:** Consultation requires one appointment; appointment can have at most one consultation (one-to-one)
- **Vital Signs:** 
  - Temperature: 35.0-42.0°C (metric, body temperature range)
  - Blood Pressure: Systolic (70-200 mmHg) and Diastolic (40-130 mmHg) as separate numeric fields
  - Pulse: 40-200 bpm (heart rate)
  - All mandatory; validation blocks save if missing or out of range
- **Medications:** Simple list of medication names (strings); no dosage/frequency in F3 (deferred to F4)
- **Optional Fields:** Complaints and diagnosis are free-form text; no validation
- **Status:** "Completed" (saved), "Cancelled" (soft delete); no "Draft" status (save is final)
- **Consultation Date:** Defaults to appointment date; not explicitly editable by user

### Appointment Integration
- **Eligibility:** Appointment must exist, have status "Scheduled" or "Completed", and belong to same patient
- **Readonly Appointment:** After consultation created, appointment cannot be changed (reassignment not allowed)
- **Navigation:** Consultations accessed from daily schedule (F2) via per-appointment buttons
- **Referential Integrity:** Not enforced at database level; orphaned records handled gracefully (show "Unknown")

### UI/UX Decisions
- **Appointment Dropdown:** Pre-populated on form load from F2 storage; shows "Patient Name - Date Time" format
- **Patient Display:** Readonly after appointment selected (auto-populated from F1)
- **Vital Display Units:** Always shown (°C, mmHg, bpm) to avoid user confusion
- **Medications Interface:** Add/Remove buttons for dynamic list management (no pre-defined medication list)
- **Error Messages:** Specific to each failed field (not generic "Form invalid" message)
- **Validation Feedback:** Inline errors under each field; form does not submit until all valid
- **Success Message:** Confirmation message shown before redirect (2-second delay)
- **Status Indicators:** Completed=green badge, Cancelled=gray strikethrough text
- **Empty States:** Helpful messages ("No consultations", "No appointments available")

### Storage & Persistence
- **Key:** consultations (separate from patients and appointments)
- **Format:** JSON array of consultation objects
- **localStorage Limit:** 5-10MB; consultation size ~1KB each (supports 5000-10000 records)
- **No Backup:** Data loss if browser cache cleared; no server-side backup

### Integration with F1 & F2
- **Patient Lookup:** Consultations reference patientId; can filter and look up patient via F1 storage
- **Appointment Lookup:** Consultations reference appointmentId; can filter and look up appointment via F2 storage
- **Navigation Flow:** Patient Profile → View Consultations → Consultation Detail; Daily Schedule → Add Consultation → Consultation Form

### Limitations & Non-Goals (In F3 Scope)
- **No Consultation History Filtering:** F5 will handle advanced history viewing
- **No Prescription Generation:** F4 handles prescription from consultation
- **No Multi-Appointment Consultations:** One consultation per appointment
- **No Concurrent Edit Locking:** Race conditions possible if same consultation edited in multiple tabs
- **No Pagination:** All consultations rendered (MVP limitation)
- **No Physician Reassignment:** Consultation remains with original physician (F2 appointment not re-assignable in F3)
- **No Visit Status Beyond Consultation:** Only consultation records; no discharge/follow-up status tracking

### Error Handling & Edge Cases
| Case | Handling |
|------|----------|
| Vital out of range | Specific error message: "Temperature must be between 35.0-42.0°C" |
| Missing vital | Error: "Temperature is required" |
| Invalid appointment ID | "Appointment not found; please select a valid appointment" |
| Appointment with wrong patient | "Selected appointment does not match patient" |
| Cancelled appointment selected | "Cannot create consultation for cancelled appointment" |
| Patient deleted (orphaned consultation) | "Unknown Patient" displayed; consultation viewable but unlinked |
| localStorage quota exceeded | Graceful failure; show "Cannot save — storage quota exceeded" |
| Double-submit | Submit button disabled during save; re-enabled after response |
| Concurrent edit in multiple tabs | Last write wins; no conflict resolution |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Vital range validation too strict | Allow physician feedback; adjust ranges if needed in F3+ iteration |
| Appointments not available (dropdown empty) | Show helpful error: "No appointments available; create appointment in F2 first" |
| Patient data deleted while consultation exists | Handle gracefully; show "Unknown Patient"; allow cancelling orphaned consultations |
| Concurrent browser tab edits | Accept limitation; document in UI or user guide |
| Performance with 100+ consultations | MVP limitation; implement pagination in F3+ enhancement |
| localStorage quota exceeded | Monitor usage; warn user at 80% capacity |
| Referential integrity violations | Accept; handle orphaned records with "Unknown" displays |
| Date/time picker browser incompatibility | Use HTML5 inputs; fallback to text if needed; test in target browser |

---

## Dependencies

- **F1 (Patient Profile Management)** — Must be completed first; consultations reference patients
- **F2 (Appointment Scheduling)** — Must be completed first; consultations require appointments
- **Browser localStorage API** — Must support 5-10MB+ data storage
- **Bootstrap 4/5 CDN** — For form & UI styling (must match F1/F2 version)
- **F4 (Prescription Generation)** — Depends on consultation data (vitals, medications, diagnosis)
- **F5 (Visit History Review)** — Depends on consultation data (for history display)

---

## Notes for Implementer

1. **Start with Storage & Model (Steps 1-3):** All other steps depend on these; ensure comprehensive testing of validators
2. **Test Vital Ranges Thoroughly:** Vital validation is critical; test boundary values (35.0, 42.0, etc.)
3. **Appointment Integration Critical:** Ensure consultation-appointment linking validates patient ID match
4. **Cross-Reference Data Carefully:** When loading consultation, also load patient and appointment; handle missing data gracefully
5. **Form Handler Complexity:** Dynamic medication list management requires careful JavaScript (add/remove, bind event handlers)
6. **localStorage Keys:** Use consistent naming ("consultations") to avoid conflicts; consider namespacing if many features added
7. **Referential Integrity:** No foreign key enforcement; assume data may become orphaned; design for graceful degradation
8. **Mobile Responsiveness:** Test numeric inputs and date pickers on mobile browsers
9. **Browser DevTools:** Regularly inspect localStorage to verify consultation records and structure
10. **User Feedback:** Ensure validation error messages are specific and actionable (not generic errors)
11. **Accessibility:** Consider WCAG compliance for form inputs and labels
12. **One-to-One Constraint:** If enforcing one consultation per appointment, add logic to prevent duplicates
13. **Status Workflow:** Clarify: Can consultations be un-cancelled? (Current: soft delete is final)

---

## Status

✅ **Plan created and ready for review.**

All implementation steps defined with clear file paths, acceptance criteria, verification methods, and risk analysis. Awaiting approval before code implementation begins.

---

## Questions to Clarify Before Implementation

1. **Vital Range Values:** Are the specified ranges (temp 35-42°C, BP 70-200, pulse 40-200) medically appropriate for the clinic?
2. **One-to-One Appointment Constraint:** Should each appointment have exactly one consultation, or should multiple consultations per appointment be allowed?
3. **Un-cancelling Consultations:** If a consultation is cancelled, can it be un-cancelled, or is cancellation final?
4. **Medications in F3:** Should medications just be simple names, or should we include dosage/frequency in F3 (even if not used until F4)?
5. **Visit Date vs Appointment Date:** Should consultation date match appointment date, or can physician record consultations for past appointments?
6. **Referential Integrity:** If a patient or appointment is deleted after consultation created, should consultations be deleted (hard delete) or kept with "Unknown Patient" (soft delete)?
7. **Future Enhancements:** For MVP scope, should we design storage/structure to support filtering/searching consultations (even if not implemented in UI)?
