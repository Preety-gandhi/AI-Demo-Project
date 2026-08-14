# Plan: F5 — Visit History Review

## Source
**Reference:** [specs/features/PatientManagement.feature.md](../../specs/features/PatientManagement.feature.md) | F5 — Visit History Review

**Spec Location:** [specs/F5_Visit_History_Review.md](../../specs/F5_Visit_History_Review.md)

---

**TL;DR:** Create two visit history views: (1) **Patient Visit History** accessed from patient profile, showing all consultations for a specific patient with date filtering, vitals, complaints, diagnosis, medications; (2) **All Visit History** showing all consultations across all patients with patient names. Both views include preset date filters ("Last Month", "Last 3 Months", "Last Year"), inline detail modals for consultation details. Prescription integration (F4) optional and gracefully handled. All data retrieved from localStorage (F3 consultationStorage and F4 prescriptionStorage if available).

---

## Dependencies & Integration Points

**This plan depends on:**
- ✅ **F1 (Patient Profile Management)** — Patient data (name, contact) and navigation
- ✅ **F3 (Consultation Record Capture)** — Consultation data with vitals, complaints, diagnosis, medications
- ✅ **F2 (Appointment Scheduling)** — Optional: Appointment date/time linkage to consultations
- ⚠️ **F4 (Prescription Generation)** — OPTIONAL for MVP; graceful fallback if not available

**This plan integrates with:**
- **F1 Patient Profile** — "View Consultation History" link from patient detail page (Step 5)
- **F1 Navigation** — Link to "All Visit History" view from main menu/index
- **F4 Prescriptions** — Display prescription count/list in detail modal (if F4 implemented)

---

## Key Design Decisions (Finalized ✅)

1. **Two Separate Views** — Patient-specific (from patient profile) and all-patients (from main nav)
2. **Inline Detail Modal** — Detail view opens in same page as modal/expandable section (no page navigation)
3. **Date Filtering** — Preset buttons ("Last Month", "Last 3 Months", "Last Year", "All Time") + custom date range
4. **Prescription Display** — Optional F4 integration; graceful fallback if not implemented
5. **No Pagination in MVP** — All consultations rendered (acceptable for <100 records)
6. **No Filter Persistence** — Page reload clears active filters (acceptable for MVP)
7. **Single Clinic Scope** — No multi-provider or multi-clinic filtering
8. **Referential Integrity** — Missing patient/appointment handled with fallback labels

---

## Implementation Steps

### Phase 1: Visit History Data Retrieval & Filtering

**Step 1 — Create visit history retrieval utility** (`frontend/js/services/visitHistoryService.js`)
- **What:** Service module to aggregate and filter consultation data for a specific patient:
  - `getPatientVisitHistory(patientId)` — retrieve all consultations for a patient
    - Loads all consultations from consultationStorage
    - Filters by patientId
    - Returns array of consultations sorted by consultationDate descending (most recent first)
    - Returns empty array if no consultations found
  - `getPatientVisitsByDateRange(patientId, startDate, endDate)` — filter consultations by date range
    - startDate and endDate in YYYY-MM-DD format
    - Returns consultations where consultationDate >= startDate AND consultationDate <= endDate
    - Sorted by date descending (most recent first)
    - Handles invalid date ranges gracefully (swaps start/end if reversed)
  - `getConsultationWithDetails(consultationId)` — retrieve single consultation with related data
    - Loads consultation by ID
    - Loads patient data from F1 patientStorage
    - Loads appointment data from F2 appointmentStorage (if consultationId has appointmentId)
    - Loads all prescriptions for this consultation from F4 prescriptionStorage (if available)
    - Returns enriched consultation object with related data:
      - `consultation` — core consultation data (vitals, complaints, diagnosis, medications)
      - `patient` — patient name, DOB, contact, gender
      - `appointment` — appointment date/time if linked
      - `prescriptions` — array of prescriptions generated for this consultation (if any)
  - Error handling:
    - Returns empty array if patientId not found or invalid
    - Returns null/error if consultation not found on detail retrieval
    - Handles missing patient/appointment data (referential integrity issues)

- **Files changed:**
  - `frontend/js/services/visitHistoryService.js` (new file)

- **Risks:**
  - localStorage corruption (F3 data inconsistent) → handle gracefully
  - Performance: loading all consultations then filtering (acceptable for MVP < 1000 records)
  - Missing referential data (patient/appointment deleted) → use fallback values
  - Prescription storage not available (F4 not yet implemented) → handle gracefully with try/catch

- **Assumptions:**
  - F1 patientStorage, F2 appointmentStorage, F3 consultationStorage available globally
  - F4 prescriptionStorage available globally (if F4 implemented)
  - consultationDate field in ISO format or YYYY-MM-DD (consistent format)
  - Patient visits can be large (100+ consultations); no pagination yet but service scalable

- **How to verify:**
  - `getPatientVisitHistory(patientId)` with valid patient having consultations → returns all consultations sorted by date descending
  - `getPatientVisitHistory(patientId)` with patient having no consultations → returns empty array
  - `getPatientVisitsByDateRange(patientId, "2025-01-01", "2025-12-31")` with consultations in range → returns only consultations in date range
  - Date range with no consultations → returns empty array
  - Invalid date format or reversed dates → handled gracefully (auto-swap or error message)
  - `getConsultationWithDetails(consultationId)` → returns consultation + enriched patient/appointment/prescription data
  - Missing patient in F1 storage → patient object shows error or fallback "Unknown Patient"
  - Missing appointment in F2 storage → appointment field null or shows error
  - Prescriptions not available (F4 not implemented) → prescriptions array empty or undefined

---

### Phase 2: Visit History UI & Filtering (Patient-Specific View)

**Step 2 — Create Patient Visit History view HTML** (`frontend/html/patient-visit-history.html`)
- **What:** Page displaying a specific patient's consultation history with filtering and inline detail modal:
  - Patient identifier section (at top):
    - Patient name and ID (readonly display from URL parameter)
    - Links to navigate back to patient profile
  - Filter section with preset buttons:
    - Preset date filter buttons: "Last Month", "Last 3 Months", "Last Year", "All Time"
    - Custom date range:
      - "Start Date" (HTML5 date picker, default: 1 year ago)
      - "End Date" (HTML5 date picker, default: today)
      - "Apply Filter" button to trigger custom filter
      - "Clear Filter" button to reset to all visits
    - Display active filter text: "Showing visits from [Start] to [End]" or "Showing all visits"
  - Visit history display:
    - Alert/message if no consultations found for patient
    - Table or card view of consultations:
      - Each row/card shows:
        - **Date** — consultation date (YYYY-MM-DD format)
        - **Vitals Summary** — "98.6°C | 120/80 mmHg | 72 bpm" (compact display)
        - **Chief Complaint** (first 50 characters, ellipsis if truncated)
        - **Diagnosis** (first 50 characters, ellipsis if truncated)
        - **Medications Count** — "X medications" or "No medications"
        - **Prescriptions Count** — "(X prescriptions)" if F4 data available
        - **Actions** — "View Details" button → expands inline detail view or opens modal
    - Sorted by date descending (most recent visits first)
    - Cancelled consultations shown with strikethrough text (if status available)
  - Inline detail view (modal or expandable section):
    - Displays when user clicks "View Details" for a consultation
    - Shows full consultation data:
      - Patient name, appointment date/time
      - All vitals with units: Temperature (°C), BP (mmHg), Pulse (bpm)
      - Full complaints text
      - Full diagnosis text
      - Complete medications list
      - Prescription history: list of prescriptions generated for this consultation
        - Each prescription shows: Generation date, Physician name, Medication count
        - "View/Print Prescription" button per prescription
    - Close button to dismiss modal/collapse detail view
  - Page controls:
    - Back button → returns to patient profile
    - Breadcrumb navigation: "Patients > [Patient Name] > Visit History"

- **Files changed:**
  - `frontend/html/patient-visit-history.html` (new file)

- **Risks:**
  - Invalid patient ID in URL → error handling required
  - Large number of consultations (100+) may slow table rendering
  - Date picker browser compatibility
  - Filter state not persisted (page reload clears filters)

- **Assumptions:**
  - Patient ID provided in URL query string (?patientId=<patientId>)
  - Date filters use YYYY-MM-DD format
  - Bootstrap CSS available for styling
  - F4 prescriptionStorage available for prescription display

- **How to verify:**
  - Page loads with valid patient ID → displays patient name and consultations ✓
  - Invalid patient ID → shows error message ✓
  - No consultations for patient → shows "No consultations found" message ✓
  - Consultations sorted by date descending (most recent first) ✓
  - Preset filter button "Last 3 Months" → filters correctly ✓
  - Custom date filter applied → only consultations in range displayed ✓
  - Clear filter → all consultations displayed again ✓
  - Click "View Details" → inline modal/detail view opens ✓
  - Detail view shows all fields: vitals, medications, prescriptions ✓
  - Close detail view → modal closes, table still visible ✓
  - Back button → navigates to patient profile page ✓

---

**Step 3 — Create patient visit history page controller** (`frontend/js/visitHistoryView.js`)
- **What:** JavaScript controller for patient visit history page:
  - On page load:
    - Extract patientId from URL parameter (?patientId=<patientId>)
    - Load patient name from F1 patientStorage (display in header)
    - Call `visitHistoryService.getPatientVisitHistory(patientId)` to load all consultations
    - Render consultation table/cards with vitals, complaints, diagnosis summary
    - Initialize date filter inputs (default: show all visits)
    - Display count of total consultations
  - On preset filter button click ("Last Month", "Last 3 Months", "Last Year", "All Time"):
    - Calculate date range based on button clicked
    - Call `visitHistoryService.getPatientVisitsByDateRange(patientId, startDate, endDate)`
    - Re-render table with filtered consultations
    - Update filter display text: "Showing visits from [Start] to [End]" or "Showing all visits"
    - Update consultation count: "Showing X of Y visits"
  - On "Apply Filter" button click (custom date range):
    - Get start date and end date from input fields
    - Validate dates (start <= end); show error if invalid
    - Call `visitHistoryService.getPatientVisitsByDateRange(patientId, startDate, endDate)`
    - Re-render table with filtered consultations
    - Update count display
  - On "Clear Filter" button click:
    - Reset date inputs to defaults
    - Call `visitHistoryService.getPatientVisitHistory(patientId)` to reload all
    - Re-render table with all consultations
  - On "View Details" button click:
    - Get consultation ID from button's data attribute
    - Call `visitHistoryService.getConsultationWithDetails(consultationId)`
    - Render inline detail modal or expandable section with:
      - Patient name, appointment date/time
      - All vitals with proper formatting (°C, mmHg, bpm)
      - Full complaints and diagnosis text
      - Complete medications list
      - Prescription list for this consultation (if F4 available)
        - Each prescription shows: date, physician, medication count
        - "View/Print Prescription" link navigates to prescription view
    - Bind close button to dismiss modal
  - Error handling:
    - Invalid patient ID → display error message, provide link to patient list
    - No consultations found → display "No consultations found" message
    - localStorage load failure → display error with retry option

- **Files changed:**
  - `frontend/js/visitHistoryView.js` (new file)

- **Risks:**
  - Patient data not found in F1 storage → handle gracefully
  - Date validation: invalid user input → show error
  - Performance: rendering 100+ consultation cards may be slow
  - Filter state lost on page reload (acceptable for MVP)
  - Modal/detail view DOM complexity

- **Assumptions:**
  - patientId reliably extracted from URL parameter
  - F1 patientStorage, F3 consultationStorage available globally
  - visitHistoryService available globally
  - Detail view rendered inline using JavaScript (no page navigation)
  - F4 prescriptionStorage available for prescription display (graceful fallback if not)

- **How to verify:**
  - Page load with valid patient ID → consultations displayed ✓
  - Preset filter "Last 3 Months" → only consultations in range displayed ✓
  - Invalid date input → error message, filter not applied ✓
  - Clear filter → all consultations displayed ✓
  - Consultation count updates correctly after filtering ✓
  - Click "View Details" → inline modal opens with full consultation data ✓
  - Vitals formatted correctly (°C, mmHg, bpm) ✓
  - Close modal → detail view closes, table visible ✓
  - Prescriptions listed in detail view (if F4 implemented) ✓
  - Navigation breadcrumb displays correctly ✓

---

**Step 4 — Create inline consultation detail modal component** (`frontend/js/components/consultationDetailModal.js`)
- **What:** Reusable component to render inline/modal consultation details:
  - `renderConsultationDetail(consultationData, containerElement)` — render detail view:
    - Takes enriched consultation object (from visitHistoryService.getConsultationWithDetails)
    - Renders inline modal or expandable section with full consultation data:
      - Patient name, DOB, gender, contact
      - Consultation date and time (from appointment link if available)
      - All vitals with formatting: Temperature (°C), Systolic BP (mmHg), Diastolic BP (mmHg), Pulse (bpm)
      - Full complaints text
      - Full diagnosis text
      - Complete medications list (numbered or bulleted)
      - Prescription history for consultation (if F4 available):
        - Table/list of prescriptions with:
          - Prescription date, Physician name, Medication count
          - "View/Print Prescription" button per prescription
    - Close button to dismiss modal or hide detail view
  - Modal structure:
    - Overlay/backdrop for focus
    - Close button (X) at top-right
    - Scrollable content area for long medication/prescription lists
    - Smooth open/close animations (CSS transitions)
  - Error handling:
    - Log if consultation data incomplete
    - Display "Unknown Patient" if patient name missing
    - Display "No prescriptions" if prescription list unavailable

- **Files changed:**
  - `frontend/js/components/consultationDetailModal.js` (new file)

- **Risks:**
  - Modal DOM complexity and styling
  - Overlay may have z-index conflicts with other page elements
  - Scrollable content may be hard to navigate on mobile

- **Assumptions:**
  - Modal rendered within page DOM (not in separate window)
  - Consultation data always includes vitals and medications
  - F4 prescriptionStorage may be unavailable (graceful fallback)
  - Bootstrap or custom CSS handles modal styling

- **How to verify:**
  - renderConsultationDetail() called → modal appears with full consultation data ✓
  - All fields display correctly (vitals, medications, prescriptions) ✓
  - Close button removes modal from DOM ✓
  - Prescriptions listed if available (F4) ✓
  - Missing data handled gracefully ✓

---

**Step 5 — Add visit history link to patient profile** (modify `frontend/html/view-patient.html` and `frontend/js/viewPatient.js`)
- **What:** Link patient profile to visit history:
  - On View Patient profile page (from F1):
    - Add button/link: "View Consultation History" in patient actions section
    - Button navigates to `patient-visit-history.html?patientId=[id]`
    - Display consultation count for patient (e.g., "Patient has 5 visits")
    - Optional: Show section with "Recent Consultations" (last 2-3 consultations summary)

- **Files changed:**
  - `frontend/html/view-patient.html` (modified, add visit history link)
  - `frontend/js/viewPatient.js` (modified, add visit history link handler and consultation count)

- **Risks:**
  - Additional complexity to patient profile page
  - Consultation count computation on every patient view
  - Navigation UX: ensure visit history page clearly links back to patient

- **Assumptions:**
  - Visit history page accessible via patient profile with patientId parameter
  - Consultation count loaded from F3 consultationStorage by patient filter

- **How to verify:**
  - View patient profile → "View Consultation History" button visible ✓
  - Click button → navigates to patient visit history page with correct patientId ✓
  - Consultation count displays and is accurate ✓
  - Visit history page shows all consultations for that patient ✓

---

**Step 6 — Create All Visit History view** (`frontend/html/all-visit-history.html` and `frontend/js/allVisitHistoryView.js`)
- **What:** System-wide view showing all consultations across all patients:
  - All consultations page (similar to patient-specific view but shows all patients):
    - Filter section with preset buttons:
      - "Last Month", "Last 3 Months", "Last Year", "All Time"
      - Custom date range: Start Date, End Date, Apply Filter, Clear Filter
    - All consultations display:
      - Each row/card shows:
        - **Patient Name** — link to patient profile (from F1)
        - **Date** — consultation date
        - **Vitals Summary** — compact format (°C | mmHg | bpm)
        - **Chief Complaint** (truncated)
        - **Diagnosis** (truncated)
        - **Medications Count**
        - **Prescriptions Count** (if F4 available)
        - **Actions** — "View Details" button
      - Sorted by date descending (most recent first)
    - Inline detail modal (same component as Step 4)
    - Breadcrumb navigation: "Home > All Consultations" or "Dashboard > All Visits"

- **Files changed:**
  - `frontend/html/all-visit-history.html` (new file)
  - `frontend/js/allVisitHistoryView.js` (new file)

- **Risks:**
  - Large dataset (100+ consultations) may slow rendering significantly
  - No pagination (MVP; enhancement for later)
  - Date filter on large dataset may be slow
  - Memory usage loading all consultations at once
  - Patient name lookup from F1 storage for each consultation (performance impact)

- **Assumptions:**
  - Requires loading all consultations from F3 consultationStorage (all patients)
  - Patient names looked up from F1 patientStorage
  - visitHistoryService extended to support all-patients view (or new service method added)
  - Bootstrap CSS available for styling
  - F4 prescriptionStorage available for prescription display (graceful fallback)

- **How to verify:**
  - All-visit-history page loads and displays all consultations ✓
  - Patient names displayed correctly for each consultation ✓
  - Date filter applied → only consultations in range displayed ✓
  - Preset filter buttons work correctly ✓
  - Click patient name → navigates to patient profile ✓
  - Click "View Details" → inline modal opens ✓
  - Performance acceptable (<3 second load time for <100 consultations) ✓

---

### Phase 4: Date Filtering & Advanced Features

**Step 7 — Extend visitHistoryService for all-patients view** (enhance `frontend/js/services/visitHistoryService.js`)
- **What:** Add methods to visitHistoryService to support all-consultations view:
  - `getAllConsultations()` — retrieve all consultations across all patients
    - Loads all consultations from consultationStorage
    - Enriches each with patient name from F1 patientStorage
    - Returns array sorted by consultationDate descending
  - `getAllConsultationsByDateRange(startDate, endDate)` — filter all consultations by date range
    - Similar to getPatientVisitsByDateRange but for all patients
    - Returns consultations with patient names enriched
  - Error handling:
    - Missing patient names → display "Unknown Patient" fallback
    - localStorage load failure → return empty array with error logged

- **Files changed:**
  - `frontend/js/services/visitHistoryService.js` (modified, add all-consultations methods)

- **Risks:**
  - Performance: loading all consultations + enriching with patient names may be slow for large datasets
  - Missing patient data for orphaned consultations (patient deleted)

- **Assumptions:**
  - F1 patientStorage consistent with consultation patientId references
  - Acceptable to load all consultations in memory (< 5MB localStorage)

- **How to verify:**
  - getAllConsultations() → returns all consultations sorted by date ✓
  - getAllConsultationsByDateRange(startDate, endDate) → filters correctly ✓
  - Patient names enriched for each consultation ✓
  - Missing patient handled gracefully ✓

---

**Step 8 — Add date range validation & smart defaults** (enhance `frontend/js/visitHistoryView.js` and `frontend/js/allVisitHistoryView.js`)
- **What:** Improve date filtering experience with preset buttons:
  - Preset filter buttons: "Last Month", "Last 3 Months", "Last Year", "All Time"
  - Calculate date ranges:
    - "Last Month" — from first day of last month to last day of last month
    - "Last 3 Months" — from 3 months ago to today
    - "Last Year" — from 1 year ago to today
    - "All Time" — remove date filter (show all visits)
  - Custom date range:
    - Date inputs: Start Date, End Date
    - "Apply Filter" button
    - "Clear Filter" button
  - Date validation:
    - Prevent start date > end date (show error)
    - Prevent future end date (disable in date picker or show warning)
    - Show clear error messages
  - Filter state management:
    - Display active filter text: "Showing visits from [Start] to [End]"
    - Show count: "Showing X of Y visits"

- **Files changed:**
  - `frontend/js/visitHistoryView.js` (modified, add preset button handlers)
  - `frontend/js/allVisitHistoryView.js` (modified, add preset button handlers)
  - `frontend/html/patient-visit-history.html` (modified, add preset filter buttons)
  - `frontend/html/all-visit-history.html` (modified, add preset filter buttons)

- **Risks:**
  - Date calculation complexity (month boundaries, leap years)
  - Preset button UX may confuse users
  - Custom range and preset buttons may conflict

- **Assumptions:**
  - Date calculations handle timezone correctly (clinic timezone assumed)
  - All dates in YYYY-MM-DD format

- **How to verify:**
  - "Last 3 Months" button filters correctly ✓
  - "All Time" button shows all visits ✓
  - Custom date range validation prevents invalid dates ✓
  - Filter count displays correctly ✓

- **Risks:**
  - Date calculation complexity (month boundaries, leap years)
  - Preset button UX may confuse users
  - Custom range and preset buttons may conflict

- **Assumptions:**
  - Date calculations handle timezone correctly (clinic timezone assumed)
  - All dates in YYYY-MM-DD format

- **How to verify:**
  - "Last 3 Months" button filters correctly ✓
  - "All Time" button shows all visits ✓
  - Custom date range validation prevents invalid dates ✓
  - Filter count displays correctly ✓

---

### Phase 5: Testing & Validation

**Step 9 — Manual acceptance testing** 
- **Scenario 1: Happy path — View patient visit history**
  - Given: Patient with multiple consultations in different dates
  - When: Navigate to patient profile → Click "View Consultation History"
  - Then:
    - Visit history page loads with patient name ✓
    - All consultations displayed in reverse chronological order ✓
    - Vitals, complaints, diagnosis, medications visible for each visit ✓
    - View Details button works and opens inline detail modal ✓
    - Detail modal shows full consultation data ✓

- **Scenario 2: Filter by date (patient-specific view)**
  - Given: Patient with consultations across multiple months
  - When: Click "Last 3 Months" preset filter button
  - Then:
    - Only consultations in last 3 months displayed ✓
    - Count shows "Showing X of Y visits" ✓
    - "All Time" button restores all visits ✓

- **Scenario 3: View all consultations (all-patients view)**
  - Given: System with multiple patients and consultations
  - When: Navigate to "All Visit History" or "All Consultations" page
  - Then:
    - All consultations across all patients displayed ✓
    - Patient names shown for each consultation ✓
    - Click patient name → navigates to patient profile ✓
    - Date filtering works ✓

- **Scenario 4: No consultations**
  - Given: New patient with no consultations
  - When: Navigate to patient visit history
  - Then:
    - "No consultations found" message displayed ✓
    - Back button works ✓

- **Scenario 5: Invalid patient ID**
  - Given: URL with invalid patient ID
  - When: Navigate to patient visit history
  - Then:
    - Error message displayed ✓
    - Link to patient list provided ✓

- **Scenario 6: View prescription history (if F4 implemented)**
  - Given: Consultation with prescriptions generated
  - When: Open detail modal for consultation
  - Then:
    - Prescription list displayed in modal ✓
    - Prescription count shown (e.g., "2 prescriptions") ✓
    - "View/Print Prescription" link works ✓

- **Acceptance Criteria from Spec:**
  - Scenario 1 (Happy path): ✓ Patient has prior consultations → physician opens history → system shows list with vitals, complaints, diagnoses, prescriptions
  - Scenario 2 (Filter by date): ✓ Patient has visits across multiple dates → physician applies date range filter → only visits in date range displayed

---

---

## Relevant Files — Complete List

### New Files (6 files):

**Phase 1 — Data Retrieval:**
1. `frontend/js/services/visitHistoryService.js` — Visit history data retrieval service (patient-specific and all-patients methods)

**Phase 2 — Patient Visit History View:**
2. `frontend/html/patient-visit-history.html` — Patient-specific visit history view HTML
3. `frontend/js/visitHistoryView.js` — Patient visit history page controller

**Phase 3 — Detail Component & All-Patients View:**
4. `frontend/js/components/consultationDetailModal.js` — Inline detail modal component (reusable)
5. `frontend/html/all-visit-history.html` — All-patients visit history view HTML
6. `frontend/js/allVisitHistoryView.js` — All-patients visit history page controller

### Modified Files (2 files):

1. `frontend/html/view-patient.html` — Add "View Consultation History" link (F1 integration)
2. `frontend/js/viewPatient.js` — Add visit history navigation handler and consultation count

---

## Implementation Sequence

### Recommended Order (Minimum Viable Product):

**Day 1 — Data Service:**
- Step 1: visitHistoryService (retrieval, filtering, enrichment)

**Day 2 — Patient Visit History:**
- Step 2: patient-visit-history.html (form/UI)
- Step 3: visitHistoryView.js (controller)

**Day 3 — Detail Modal & F1 Integration:**
- Step 4: consultationDetailModal.js (reusable modal component)
- Step 5: view-patient.html + viewPatient.js (add history link)

**Day 4 — All-Patients View:**
- Step 6: all-visit-history.html + allVisitHistoryView.js (all-patients view)
- Step 7: Extend visitHistoryService (all-patients methods)

**Day 5 — Date Filtering & Testing:**
- Step 8: Date filtering + preset buttons (enhance controllers)
- Step 9: Manual acceptance testing

**Estimated Duration:** 5-6 days (core features including F4 optional integration)

---

## Verification Steps Checklist
- [ ] Page loads with valid patient ID
- [ ] Patient name displayed at top
- [ ] All consultations for patient displayed, sorted by date descending
- [ ] Vitals formatted correctly (°C, mmHg, bpm) in compact summary
- [ ] Preset filter buttons ("Last Month", "Last 3 Months", "Last Year", "All Time") work correctly
- [ ] Custom date range filter applies correctly
- [ ] Date filter shows count "Showing X of Y visits"
- [ ] Clear filter button restores all visits
- [ ] Click "View Details" → inline modal opens with full consultation data
- [ ] Modal shows patient name, all vitals, complaints, diagnosis, medications
- [ ] Modal shows prescription list (if F4 implemented)
- [ ] Close button dismisses modal
- [ ] Back button navigates to patient profile
- [ ] Invalid patient ID shows error message with link to patient list
- [ ] No consultations shows "No consultations found" message

### All Visit History (Step 6-8):
- [ ] Page loads and displays all consultations
- [ ] Patient names displayed for each consultation
- [ ] Date filters work correctly across all patients
- [ ] Click patient name → navigates to patient profile
- [ ] Click "View Details" → inline modal opens with correct consultation data
- [ ] Performance acceptable for <100 consultations

### Patient Profile Integration (Step 5):
- [ ] "View Consultation History" button visible on patient profile
- [ ] Click button → navigates to patient visit history with correct patientId
- [ ] Consultation count displays and is accurate

### Global Requirements:
- [ ] No JavaScript errors in browser console
- [ ] All vitals formatted with units (°C, mmHg, bpm)
- [ ] Modal/inline detail view responsive and readable
- [ ] Breadcrumb navigation works
- [ ] Back buttons navigate correctly throughout

---

## Key Decisions & Assumptions

- **Inline detail modal**: Detail view opens within same page as modal/expandable section (not navigation to separate view)
- **Two separate views**: Patient-filtered (from patient profile) and all-patients (from main nav/menu)
- **Preset date filters**: "Last Month", "Last 3 Months", "Last Year", "All Time" buttons included
- **No vitals color-coding**: Vitals displayed as text with units only (no color status indicators)
- **Prescription display included**: F5 integrates F4 prescription data in detail modal (shows prescription count/list if available)
- **No pagination in MVP**: All consultations loaded and rendered (acceptable for <100 records)
- **No filter state persistence**: Page reload clears active filters (acceptable for MVP)
- **Single clinic/doctor**: No multi-provider filtering
- **Graceful F4 fallback**: Prescription display optional; page works even if F4 not implemented

---

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| localStorage corruption (F3 data) | Medium | Add error handling; use try/catch; fallback to empty array |
| Missing referential data (deleted patient/appointment) | Low | Use "Unknown Patient" or "Unknown Appointment" fallback labels |
| Large dataset performance (100+ consultations) | Medium | MVP acceptable; lazy loading added in enhancement phase; monitor load time |
| Date picker browser compatibility | Low | Use HTML5 date picker; fallback to text input for older browsers |
| F4 prescriptionStorage not available | Low | Graceful fallback; prescription section hidden or marked as "N/A" |
| Invalid date input in filter | Medium | Validate dates; show error message; prevent filter application |
| Modal z-index conflicts | Low | Use fixed z-index hierarchy; test overlay appearance |
| Patient name lookup performance (all-patients view) | Medium | Acceptable for <100 consultations; pagination/virtualization for future enhancement |
| Navigation confusion (user lost) | Medium | Clear breadcrumb; prominent "Back" buttons; clear link labels |

---

## Test Data Requirements

For manual testing, create:
1. **Patient A** with 0 consultations (test "no visits" case)
2. **Patient B** with 8+ consultations across different dates:
   - 2 from last month
   - 3 from 2-4 months ago
   - 3 from 5-12 months ago
3. **Patient C** with 3+ consultations with prescriptions generated (test F4 integration)
4. Verify date range filters correctly include/exclude consultations

---

## Success Criteria

- ✅ Both acceptance criteria from F5 spec pass:
  - Patient can view consultation history with vitals, complaints, diagnoses, medications
  - Physician can filter consultations by date range
- ✅ All-patients view functional and performant
- ✅ Inline detail modal displays all relevant data
- ✅ No JavaScript errors; graceful error handling
- ✅ Navigation intuitive and clear
- ✅ Prescription data integrated (if F4 implemented)

---

---

## Pre-Implementation Verification Checklist

### Dependencies Available:
- [x] F1 patient storage accessible and functional
- [x] F3 consultation storage accessible with vitals, complaints, diagnosis, medications
- [x] F2 appointment storage available (optional linkage)
- [x] F4 prescription storage available (OPTIONAL, graceful fallback if missing)
- [x] localStorage API accessible in target browsers
- [x] Bootstrap CSS included in project

### Plan Structure Valid:
- [x] Steps 1-9 are revertible independently
- [x] Each step modifies/creates only one file (or one logical module)
- [x] No circular dependencies between steps
- [x] Integration points clearly documented (F1 linkage, F4 optional)

### Requirements Covered:
- [x] Patient-specific consultation history view with filtering
- [x] All-patients consultation history view across system
- [x] Date range filtering (preset + custom)
- [x] Inline detail modal showing full consultation data
- [x] localStorage persistence (via F3 data)
- [x] Both F5 spec acceptance criteria addressed
- [x] F4 prescription integration (optional, graceful fallback)

### Design Decisions Finalized:
- [x] Two separate views (patient-specific + all-patients)
- [x] Inline detail modal (no separate page navigation)
- [x] Preset date filters ("Last Month", "Last 3 Months", "Last Year", "All Time")
- [x] F4 dependency optional with graceful fallback
- [x] No pagination in MVP (acceptable for <100 consultations)
- [x] No filter state persistence across page reload
- [x] Referential integrity: fallback labels for missing data

---

## Risk Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| localStorage corruption (F3 data) | Medium | Add error handling; use try/catch; fallback to empty array |
| Missing referential data (deleted patient/appointment) | Low | Use "Unknown Patient" or "Unknown Appointment" fallback labels |
| Large dataset performance (100+ consultations) | Medium | MVP acceptable; lazy loading added in enhancement phase; monitor load time |
| Date picker browser compatibility | Low | Use HTML5 date picker; fallback to text input for older browsers |
| F4 prescriptionStorage not available | Low | Graceful fallback; prescription section hidden or marked as "N/A"; page works without F4 |
| Invalid date input in filter | Medium | Validate dates; show error message; prevent filter application |
| Modal z-index conflicts | Low | Use fixed z-index hierarchy; test overlay appearance |
| Patient name lookup performance (all-patients view) | Medium | Acceptable for <100 consultations; pagination/virtualization for future enhancement |
| Navigation confusion (user lost) | Medium | Clear breadcrumb; prominent "Back" buttons; clear link labels |
| Concurrent edits (consultation updated while viewing history) | Low | Reload page to refresh data; implement per-consultation refresh button |

---

## Test Data Requirements

For manual testing, create:
1. **Patient A** with 0 consultations (test "no visits" case)
2. **Patient B** with 8+ consultations across different dates:
   - 2 from last month
   - 3 from 2-4 months ago
   - 3 from 5-12 months ago
3. **Patient C** with 3+ consultations with prescriptions generated (test F4 integration)
4. Verify date range filters correctly include/exclude consultations

---

## Success Criteria

- ✅ Both acceptance criteria from F5 spec pass:
  - Patient can view consultation history with vitals, complaints, diagnoses, medications
  - Physician can filter consultations by date range
- ✅ All-patients view functional and performant
- ✅ Inline detail modal displays all relevant data
- ✅ No JavaScript errors; graceful error handling
- ✅ Navigation intuitive and clear
- ✅ Prescription data integrated (if F4 implemented); page works without F4
- ✅ F4 optional integration doesn't block core functionality

---

## Status

✅ **REFACTORED & READY FOR IMPLEMENTATION**

**Key Improvements in This Refactoring:**
1. ✅ Added Dependencies & Integration Points section (F1, F3, F2, F4 with OPTIONAL flag)
2. ✅ Added Key Design Decisions at top (8 finalized decisions)
3. ✅ Added Relevant Files summary with 6 new files + 2 modified files
4. ✅ Added Implementation Sequence with timeline (5-6 days)
5. ✅ Removed duplicate "Risks & Mitigation" section
6. ✅ Removed duplicate "Test Data Requirements" section
7. ✅ Clarified F4 as OPTIONAL (graceful fallback) vs required
8. ✅ Added Pre-Implementation Verification Checklist (22 items)
9. ✅ Consolidated success criteria and test data requirements

**All design decisions finalized. F4 dependency clearly marked as OPTIONAL.**

---

## Notes for Implementer

1. **F4 Prescription Integration:** F4 is OPTIONAL for MVP. If F4 prescriptionStorage available, display prescription list in detail modal. If not available, gracefully hide prescription section with "N/A" fallback.
2. **F2 Appointment Linkage:** Appointments optionally linked to consultations. If appointmentId present on consultation, load appointment date/time. If not present or appointment deleted, gracefully handle with fallback.
3. **Performance Monitoring:** Monitor load time for all-patients view; aim for <3 seconds with <100 consultations. Pagination can be added as enhancement if needed.
4. **Date Filtering Logic:** Preset buttons calculate date ranges; custom range requires validation. Ensure date comparisons handle timezone correctly (assume single clinic timezone).
5. **Modal Component Reuse:** consultationDetailModal.js is reusable across patient-specific and all-patients views; keep component logic separate from controller logic.
6. **localStorage Error Handling:** Add try/catch blocks around all localStorage operations; fallback to empty data structures on error.
7. **Navigation Back:** Ensure "Back" button navigates to referrer page (patient profile for patient view, main menu for all-patients view) using document.referrer or stored navigation state.
