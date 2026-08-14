# Plan: F2 — Appointment Scheduling

## Source
**Reference:** [.github/specs/features/PatientManagement.feature.md](../../.github/specs/features/PatientManagement.feature.md) | F2 — Appointment Scheduling

**Spec Location:** [.github/specs/F2_Appointment_Scheduling.md](../../.github/specs/F2_Appointment_Scheduling.md)

---

**TL;DR:** Extend the F1 patient management system with appointment scheduling. Build appointment data model with conflict detection, storage utilities in localStorage, Add/Edit/View appointment forms with Bootstrap, daily schedule view, and status management. All data stored in localStorage using JavaScript utilities.

---

## Dependencies & Integration Points

**This plan depends on:**
- ✅ **F1 (Patient Profile Management)** — Patient data (name, contact) for appointment assignment
- ✅ **F1 localStorage API** — Patient storage pattern to extend with appointments

**This plan integrates with:**
- **F1 Patient Profile** — "View Appointments" link from patient detail page (Step 13)
- **F1 Navigation** — Main index.html updated with Appointments link (Step 12)

---

## Key Design Decisions (Finalized ✅)

1. **Appointment Duration** — Fixed 1-hour slots (confirmed; no user-specified duration)
2. **Time Format** — 24-hour format (HH:MM); no seconds
3. **Conflict Detection** — Date + time overlap = conflict; Cancelled status does not block slots
4. **Patient Reassignment** — Physician can reassign appointment to different patient during edit
5. **Status Model** — Enum: "Scheduled", "Completed", "Cancelled" (soft delete, not hard delete)
6. **localStorage Pattern** — Extend F1 storage utilities; no backend API
7. **Navigation** — href-based (consistent with F1); URL parameters for IDs
8. **Alternative Slots** — Display 5-10 next available times when conflict detected

---

## Implementation Steps

### Phase 1: Foundation & Data Model

**Step 1 — Create appointment storage utility module** (`frontend/js/storage/appointmentStorage.js`)
- **What:** Functions for appointment CRUD operations: `saveAppointment()`, `loadAppointment()`, `deleteAppointment()`, `getAllAppointments()`, `getAppointmentById()`, `getAppointmentsByDate()`, `updateAppointmentStatus()`, `checkTimeSlotAvailable()`
- Serializes/deserializes appointment JSON objects to/from localStorage
- **Files changed:** 
  - `frontend/js/storage/appointmentStorage.js` (new file)
- **Risks:**
  - localStorage has 5-10MB limit; data loss if browser cache is cleared
  - No server-side backup; concurrent browser tabs may have sync issues
- **Assumptions:**
  - F1 patient storage already exists with working patient storage utilities
  - Time conflicts checked based on exact date + time slot overlap (no duration field initially)
- **How to verify:**
  - Test saving appointment → reload page → data persists
  - Test `getAllAppointments()` returns all saved appointments
  - Test `getAppointmentsByDate()` filters by date correctly
  - Test `checkTimeSlotAvailable()` correctly identifies conflicts

---

**Step 2 — Create appointment data model** (`frontend/js/models/appointment.js`)
- **What:** Appointment class with fields:
  - `id` (UUID v4) — unique identifier
  - `patientId` (UUID v4) — reference to F1 patient
  - `appointmentDate` (YYYY-MM-DD) — scheduling date
  - `appointmentTime` (HH:MM in 24-hour format) — scheduled time
  - `status` (enum: "Scheduled", "Completed", "Cancelled") — appointment state
  - `notes` (optional string) — physician notes
  - `createdAt` (ISO timestamp) — creation date
  - `updatedAt` (ISO timestamp) — last modification date
- Includes validation logic:
  - Required: patientId, appointmentDate, appointmentTime
  - Date validation: must be today or future date
  - Time validation: valid 24-hour format (00:00-23:59)
  - Status validation: only valid enum values
- **Files changed:**
  - `frontend/js/models/appointment.js` (new file)
- **Risks:**
  - Manual validation required (no framework); edge cases may be missed
  - No timezone handling (assumes single clinic timezone)
- **Assumptions:**
  - Time slots are assumed to be 30-min or 1-hour fixed durations (not specified, may need clarification)
  - No appointment duration field yet (F2 spec silent on this)
- **How to verify:**
  - Create valid appointment objects; all fields exist with correct types
  - Invalid date (past) → throws error
  - Invalid time format → throws error
  - Valid appointment with all fields → no errors

---

### Phase 2: Appointment Forms & UI

**Step 3 — Create Add Appointment form HTML** (`frontend/html/add-appointment.html`)
- **What:** Bootstrap form with fields:
  - Patient Selector (dropdown/search from F1 patient list) — required
  - Appointment Date (HTML5 date picker, min=today) — required
  - Appointment Time (HTML5 time picker, HH:MM format) — required
  - Notes (optional textarea)
  - Submit button → calls validation handler
  - Cancel button → returns to appointments list
  - Conflict warning display area (initially hidden, shown if conflict detected)
- **Files changed:**
  - `frontend/html/add-appointment.html` (new file)
- **Risks:**
  - HTML5 date/time pickers have limited browser support; fallback to text input may be needed
  - Patient selector may be slow if many patients exist (F1 has no pagination)
- **Assumptions:**
  - F1 patient list page exists and patients can be loaded from localStorage
  - Appointments use 24-hour time format
- **How to verify:**
  - Form renders correctly with all fields
  - Date picker shows today as minimum date
  - Cancel button navigates back to appointments list
  - Patient dropdown populates from F1 patient data

---

**Step 4 — Create form validation & submission handler for Add Appointment** (`frontend/js/forms/addAppointmentForm.js`)
- **What:** 
  - Validates all form fields (required, format, date range)
  - Calls `checkTimeSlotAvailable()` from appointmentStorage to detect conflicts
  - If conflict detected: displays error message with list of alternative available slots
  - If valid: generates unique appointment ID, calls `saveAppointment()` to localStorage
  - Shows success confirmation message
  - Redirects to daily schedule view after 2-second delay
- **Files changed:**
  - `frontend/js/forms/addAppointmentForm.js` (new file)
- **Risks:**
  - Double-submit race condition; must disable button on first click
  - Conflict detection algorithm may have edge cases (e.g., exact same time)
  - No feedback if F1 patient storage fails to load
- **Assumptions:**
  - localStorage write succeeds (will fail silently if storage quota exceeded)
  - Appointment duration is fixed (e.g., 1 hour); user cannot specify duration
- **How to verify:**
  - Valid appointment (patient, future date, available time) → saves to localStorage
  - Missing required field (patient, date, or time) → displays error, prevents submit
  - Duplicate time slot → displays conflict message with alternative times
  - Submit button disabled during submission to prevent double-submit

---

**Step 5 — Create Edit Appointment form HTML** (`frontend/html/edit-appointment.html`)
- **What:** Same as add-appointment.html but:
  - Pre-populated with existing appointment data from URL parameter (`?id=<appointmentId>`)
  - Patient field is editable; physician can reassign appointment to different patient
  - When patient is changed, system re-validates new patient + date + time for conflicts
  - Submit → updates localStorage via full appointment update (including patientId change)
  - Back button → returns to daily schedule
- **Files changed:**
  - `frontend/html/edit-appointment.html` (new file)
- **Risks:**
  - Concurrent edit race conditions (no locking mechanism)
  - Invalid appointment ID in URL → error handling required
  - Reassigning patient to occupied slot may create confusion; must re-validate conflicts
- **Assumptions:**
  - Appointment ID provided in URL query string
  - Patient can be changed after appointment creation; reassignment must re-check time conflicts
- **How to verify:**
  - Valid appointment ID → form pre-fills with existing data
  - Invalid/missing appointment ID → shows error message
  - Edit time to new available slot → saves successfully
  - Edit time to occupied slot → shows conflict error

---

**Step 6 — Create edit appointment form handler** (`frontend/js/forms/editAppointmentForm.js`)
- **What:**
  - Pre-populate form with existing appointment data from appointmentStorage
  - Validate on submit (same rules as add-appointment, except date cannot be in past)
  - Call `checkTimeSlotAvailable()` excluding current appointment from conflict check
  - If patient is reassigned: re-validate new patient + date + time combination for conflicts
  - Update appointment via `updateAppointment()` call with all modified fields (including patientId)
  - Show success message and redirect to daily schedule
- **Files changed:**
  - `frontend/js/forms/editAppointmentForm.js` (new file)
- **Risks:**
  - Must exclude current appointment from conflict check (avoid false positives)
  - Double-submit race conditions
  - localStorage update failures
  - Patient reassignment to occupied slot must be caught by conflict detection
- **Assumptions:**
  - Appointment status can be updated to "Completed" or "Cancelled" during edit
  - Physician can change patient field; reassignment must pass conflict validation
- **How to verify:**
  - Edit existing appointment → pre-fill works
  - Modify time to available slot → save succeeds
  - Modify time to occupied slot → conflict error
  - Change status from "Scheduled" to "Completed" → saves successfully

---

### Phase 3: Schedule Views & Conflict Detection

**Step 7 — Create daily appointment list/schedule view** (`frontend/html/daily-schedule.html`)
- **What:** Display of all appointments for a selected date:
  - Date selector (default = today) to filter appointments
  - Time-ordered table/list of appointments:
    - Columns: Time, Patient Name, Status, Actions (View/Edit/Cancel)
  - "Add Appointment" button to link to add-appointment form
  - Empty state: "No appointments scheduled for this date"
  - Indicators for appointment status (color-coded: Scheduled=blue, Completed=green, Cancelled=gray)
- **Files changed:**
  - `frontend/html/daily-schedule.html` (new file)
- **Risks:**
  - Large number of appointments per day may make list slow to render
  - No pagination implemented (MVP only)
- **Assumptions:**
  - Single clinic, single doctor (F2 scope); no multi-doctor views
  - Appointments display for selected day only (not week/month view)
- **How to verify:**
  - Select today's date → shows all appointments for today, sorted by time
  - Select past/future date → shows appointments for that date
  - No appointments → shows "No appointments" message
  - Status indicators display correctly for each appointment

---

---

**Step 8 — Create daily schedule loader** (`frontend/js/appointmentSchedule.js`)
- **What:**
  - Load all appointments from appointmentStorage
  - Filter by selected date
  - Sort by time (ascending, earliest to latest)
  - Format appointment data for table display (with patient names looked up from F1 storage)
  - Return formatted appointments array
- **Files changed:**
  - `frontend/js/appointmentSchedule.js` (new file)
- **Risks:**
  - Patient name lookup may fail if patient deleted from F1 storage (orphaned appointments)
  - Date filtering may have timezone issues
  - Performance degradation if many appointments (100+) exist per day (no pagination)
- **Assumptions:**
  - Patient data always available in F1 storage for reference (referential integrity not enforced)
  - Date selected in HTML5 date picker always in valid YYYY-MM-DD format
  - Return value is array of formatted appointment objects ready for rendering
- **How to verify:**
  - Load schedule with 0, 5, 20+ appointments → array formatted correctly
  - Verify time ordering (earliest to latest)
  - Patient names display correctly by looking up F1 patient data
  - Empty array returned when no appointments exist for date

---

**Step 9 — Create appointment action button handlers** (`frontend/js/handlers/appointmentActions.js`)
- **What:**
  - Event handlers for View, Edit, Cancel buttons in daily schedule:
    - View button: navigate to view-appointment.html?id=<appointmentId>
    - Edit button: navigate to edit-appointment.html?id=<appointmentId>
    - Cancel button: show confirmation dialog, call cancel handler
  - Load appointment from storage and display details in modal or redirect
  - Bind click handlers to all action buttons in schedule table
  - Error handling: log if appointment not found
- **Files changed:**
  - `frontend/js/handlers/appointmentActions.js` (new file)
- **Risks:**
  - Button event binding may fail if DOM elements not yet rendered
  - Navigation URLs must match actual routes (error handling for invalid IDs)
- **Assumptions:**
  - Action buttons have consistent DOM IDs or data attributes
  - Navigate via href (not programmatically)
  - Appointment ID provided in URL query string to other pages
- **How to verify:**
  - Click View button → navigates to view-appointment.html with correct ID
  - Click Edit button → navigates to edit-appointment.html with correct ID
  - Click Cancel button → confirmation dialog appears
  - No console errors when binding handlers

---

**Step 10 — Create conflict detection & availability checker** (modify `frontend/js/storage/appointmentStorage.js`)
- **What:** Enhance appointmentStorage with:
  - `checkTimeSlotAvailable(date, time, excludeAppointmentId)` function
  - Returns true if slot available, false if conflict exists
  - Also returns `getAlternativeSlots(date, excludeTime)` function
  - Returns list of 5-10 next available time slots on same date (or next available date)
  - Conflict logic: date + time match = conflict (fixed 1-hour slot duration)
- **Files changed:**
  - `frontend/js/storage/appointmentStorage.js` (modified)
- **Risks:**
  - "Alternative slots" logic may suggest impossible times (e.g., 23:00 with 1-hour duration)
  - Concurrent browser tabs may race during conflict check
- **Assumptions:**
  - Only active appointments ("Scheduled", "Completed") block slots; "Cancelled" do not
  - Slot duration is fixed at 1 hour (confirmed)
  - Alternative slots offered on same date first, then next available date
  - When patient is reassigned in Step 5, same conflict detection logic applies
- **How to verify:**
  - No existing appointment at 14:00 → `checkTimeSlotAvailable('2026-08-15', '14:00')` returns true
  - Existing appointment at 14:00 → returns false
  - Call with excludeAppointmentId of same appointment → returns true (self doesn't conflict)
  - `getAlternativeSlots()` returns 5-10 times in correct order

---

### Phase 4: Cancel & Status Management

**Step 11 — Add cancel appointment functionality** (modify `frontend/js/handlers/appointmentActions.js`)
- **What:**
  - Cancel button handler in appointment action handlers:
  - Display confirmation dialog: "Cancel this appointment?"
  - On confirm: call `updateAppointmentStatus(appointmentId, 'Cancelled')`
  - Update UI to show "Cancelled" status and refresh schedule display
  - No hard delete; soft delete via status update (appointment remains in history)
- **Files changed:**
  - `frontend/js/handlers/appointmentActions.js` (modified to add cancel handler)
- **Risks:**
  - Accidental cancellation (require user confirmation, already mitigated)
  - localStorage update failure leaves UI in inconsistent state
- **Assumptions:**
  - Cancelled appointments should still appear in schedule (not permanently deleted)
  - Only "Scheduled" status can be cancelled (not "Completed" or "Cancelled")
  - Cancelled appointments do not block time slots for new bookings
- **How to verify:**
  - Click Cancel → confirmation dialog appears
  - Confirm → appointment status changes to "Cancelled" in UI
  - Appointment still visible in schedule with "Cancelled" indicator
  - Cancelled appointments don't prevent new bookings at same time

---

**Step 12 — Implement appointment status transitions** (create `frontend/js/appointmentStatus.js`)
- **What:** Status management logic:
  - Valid transitions: Scheduled → Completed, Scheduled → Cancelled, Completed → (no change), Cancelled → (no change)
  - UI buttons reflect allowed transitions (e.g., "Mark as Completed" only shown if Scheduled)
  - Validation: prevent invalid transitions
- **Files changed:**
  - `frontend/js/appointmentStatus.js` (new file)
- **Risks:**
  - Race conditions if same appointment modified in two browser tabs
  - No audit trail of status changes (who, when changed status)
- **Assumptions:**
  - Single user per browser; no multi-user conflict detection
  - Status history not required (only current status stored)
- **How to verify:**
  - Scheduled appointment → "Mark as Completed" button available
  - Click button → status changes to "Completed"
  - Completed appointment → no status change buttons available
  - Cancelled appointment → status immutable

---

### Phase 5: Navigation & Integration

**Step 13 — Add Appointments navigation to main app** (modify `frontend/html/index.html`)
- **What:** Update main landing page:
  - Add "Manage Appointments" link/button to appointments list/schedule view
  - Navigation menu includes: Patients, Appointments, Consultations (F3+)
  - Maintain header/footer consistent with F1 design
- **Files changed:**
  - `frontend/html/index.html` (modified)
- **Risks:**
  - Navigation structure may not scale for many features (F3-F7)
  - Inconsistent styling across pages if CSS not centralized
- **Assumptions:**
  - F1 index.html already exists with basic structure
  - Bootstrap CSS included globally
- **How to verify:**
  - index.html renders correctly
  - "Manage Appointments" link navigates to daily-schedule.html
  - Back links from appointments work correctly

---

**Step 14 — Add appointment navigation from Patient Profile** (modify `frontend/html/view-patient.html` and `frontend/js/viewPatient.js`)
- **What:** On View Patient profile page:
  - Add "View Appointments" button to show all appointments for this patient
  - Alternatively, add new page `frontend/html/patient-appointments.html` to filter appointments by patient
  - Links back to patient profile or appointments list
- **Files changed:**
  - `frontend/html/view-patient.html` (modified, add button)
  - `frontend/js/viewPatient.js` (modified, add handler)
  - `frontend/html/patient-appointments.html` (new file, optional)
  - `frontend/js/patientAppointments.js` (new file, optional)
- **Risks:**
  - Added complexity to view-patient page
  - Patient-specific appointments view may conflict with daily schedule view (two ways to see appointments)
- **Assumptions:**
  - Patient profile page exists from F1 implementation
  - Appointments filtered by `patientId` match
- **How to verify:**
  - View patient profile → "View Appointments" button visible
  - Click → shows only appointments for this patient
  - Links navigate back correctly

---

### Phase 6: Polish & Styling

**Step 15 — Add appointment-specific CSS** (modify `frontend/css/styles.css`)
- **What:** Styles for:
  - Appointment form (input styling, consistent with F1)
  - Daily schedule table (time ordering, status color indicators)
  - Conflict warning message (red alert with alternative slots)
  - Status badges (Scheduled=blue, Completed=green, Cancelled=gray)
  - Responsive design for mobile (if applicable)
  - Consistent Bootstrap integration
- **Files changed:**
  - `frontend/css/styles.css` (modified)
- **Risks:**
  - CSS conflicts with Bootstrap or F1 styles
  - Mobile responsiveness may break on small screens
- **Assumptions:**
  - Bootstrap CDN already included in all HTML files
  - F1 styles already defined; appointment styles should extend, not override
- **How to verify:**
  - All appointment pages render with polished UI
  - Color-coded status badges display correctly
  - Conflict messages stand out visually
  - Mobile view (if tested) remains usable

---

### Phase 7: Testing & Validation

**Step 16 — Manual acceptance testing**
- **What:** Execute all test scenarios:
  - **Scenario 1: Create appointment successfully**
    - Create appointment with valid patient, future date, available time → appointment saved and visible in daily schedule ✓
  - **Scenario 2: Prevent duplicate time slot booking**
    - Create first appointment at 14:00 → save succeeds
    - Create second appointment at same date & time → conflict error displayed with alternative slots ✓
  - **Additional scenarios:**
    - Edit appointment: change time to different available slot → saves successfully ✓
    - Cancel appointment: click cancel → confirmation → status changes to "Cancelled" ✓
    - Mark as Completed: change status "Scheduled" → "Completed" → saves successfully ✓
    - View patient appointments: navigate from patient profile → shows only this patient's appointments ✓
    - Daily schedule navigation: select past/future date → appointments filtered correctly ✓
    - Empty state: no appointments for date → "No appointments" message displays ✓
- **Files affected:** All F2 files
- **Risks:**
  - Manual testing may miss edge cases
  - Browser differences in date/time picker behavior
- **Assumptions:**
  - F1 patient data exists in localStorage from prior testing
  - All HTML5 date/time pickers supported in target browser
- **How to verify:**
  - Open browser DevTools → Application → localStorage → verify appointment records created
  - Refresh page → appointment data persists
  - All acceptance criteria from F2 spec pass (Scenario 1 & 2)
  - No console errors during testing

---

---

## Relevant Files — Complete List

### New Files (13 files):

**Phase 1 — Foundation & Data Model:**
1. `frontend/js/storage/appointmentStorage.js` — Appointment localStorage CRUD operations & basic availability check
2. `frontend/js/models/appointment.js` — Appointment data model with validation

**Phase 2 — Appointment Forms & UI:**
3. `frontend/html/add-appointment.html` — Add appointment form
4. `frontend/js/forms/addAppointmentForm.js` — Add appointment form validation & submission
5. `frontend/html/edit-appointment.html` — Edit appointment form
6. `frontend/js/forms/editAppointmentForm.js` — Edit appointment form validation & submission

**Phase 3 — Schedule Views:**
7. `frontend/html/daily-schedule.html` — Daily schedule/appointments list view
8. `frontend/js/appointmentSchedule.js` — Schedule loader (load, filter, sort appointments)
9. `frontend/js/handlers/appointmentActions.js` — Action button handlers (View, Edit, Cancel)

**Phase 4 — Status & Cancel:**
10. `frontend/js/appointmentStatus.js` — Status transition validation logic

**Phase 5 — Optional Patient View:**
11. `frontend/html/patient-appointments.html` — (Optional) Patient-specific appointments list
12. `frontend/js/patientAppointments.js` — (Optional) Patient appointments loader

### Modified Files (3 files):

1. `frontend/html/index.html` — Add navigation link to appointments
2. `frontend/html/view-patient.html` — Add "View Appointments" button (F1 integration)
3. `frontend/js/viewPatient.js` — Add handler for "View Appointments" button
4. `frontend/css/styles.css` — Add appointment-specific styling (forms, schedule table, status badges)

---

## Implementation Sequence

### Recommended Order (Minimum Viable Product):

**Day 1 — Foundation & Data Model:**
- Step 1: Storage utility (CRUD)
- Step 2: Appointment data model

**Day 2 — Add Appointment Forms:**
- Step 3-4: Add appointment form + handler
- Step 5-6: Edit appointment form + handler
- Step 10: Conflict detection enhancement (modify storage)

**Day 3 — Daily Schedule View:**
- Step 7: Daily schedule HTML
- Step 8: Schedule loader
- Step 9: Action button handlers
- Step 11: Cancel functionality
- Step 12: Status transitions

**Day 4 — Integration & Polish:**
- Step 13: App navigation (index.html)
- Step 14: Patient navigation (view-patient.html)
- Step 15: Appointment CSS styling
- Step 16: Manual testing

**Estimated Duration:** 4-5 days
- Day 1: Steps 1-2 (foundation)
- Day 2: Steps 3-6, 10 (forms + conflict detection)
- Day 3: Steps 7-9, 11-12 (schedule view + handlers)
- Day 4: Steps 13-15 (integration + polish)
- Day 5: Step 16 (testing + QA)

---

## Verification Steps Checklist

1. **Data Model** — Appointment objects have all 7 fields (id, patientId, date, time, status, notes, timestamps) ✓
2. **localStorage Persistence** — Save appointment → reload page → data persists ✓
3. **Conflict Detection** — Existing 14:00 slot → reject new 14:00 appointment ✓
4. **Alternative Slots** — Conflict detected → suggest 5+ alternative times ✓
5. **Add Appointment** — Valid data → appears in daily schedule with status "Scheduled" ✓
6. **Validation** — Missing required field (patient, date, time) → error blocks submit ✓
7. **Daily Schedule** — Appointments display for selected date, sorted by time ✓
8. **Edit Appointment** — Form pre-fills → modify time → save → schedule updates ✓
9. **Cancel Appointment** — Click cancel → confirm → status changes to "Cancelled" ✓
10. **Patient Navigation** — View patient profile → "View Appointments" → shows only this patient's appointments ✓
11. **Status Transitions** — Valid transitions allowed; invalid transitions blocked ✓
12. **UI Consistency** — All appointment pages match F1 design & Bootstrap styling ✓
13. **Empty State** — No appointments for date → "No appointments" message displays ✓
14. **Acceptance Criteria** — Both F2 spec scenarios pass ✓

---

## Key Decisions & Assumptions

### Architecture
- **No backend API:** localStorage only; extends F1 storage pattern
- **Manual routing:** href-based navigation with URL parameters (consistent with F1)
- **HTML5 date/time pickers:** Bootstrap form integration with JavaScript fallback
- **Single-user, single-browser:** No multi-user sync; concurrent tab conflicts possible but unlikely

### Appointment Model
- **Fixed 1-hour slots:** Confirmed; each appointment occupies exactly 1 hour (no duration field)
- **Time format:** 24-hour (HH:MM); no seconds
- **Date format:** YYYY-MM-DD (ISO 8601)
- **Status enum:** "Scheduled", "Completed", "Cancelled" (soft delete)
- **Conflict logic:** Date + time overlap = conflict; Cancelled status does not block slots
- **Patient reassignment:** Physician can reassign appointment to different patient during edit

### Conflict Detection
- **Algorithm:** Check all non-Cancelled appointments for same date & time
- **Alternative slots:** Suggest next 5-10 available times on same date, then subsequent dates
- **Assumption:** 1-hour appointment duration (spec does not define)

### UI/UX
- **Daily view default:** Show today's appointments on initial page load
- **Date picker:** Minimum date = today; no past appointments allowed
- **Patient selector:** Dropdown from F1 patient list (may be slow with many patients)
- **Empty state:** "No appointments scheduled for this date" message
- **Status indicators:** Color-coded badges (Scheduled=blue, Completed=green, Cancelled=gray)
- **Confirmation dialogs:** Required before cancelling appointments

### Integration with F1
- **Patient lookup:** Appointments reference F1 patients by patientId
- **Referential integrity:** Not enforced; orphaned appointments possible if patient deleted
- **Navigation:** "View Appointments" button on patient profile links to patient-specific appointments
- **Storage:** Separate from F1 patient storage; stored in separate localStorage key

### Limitations & Non-Goals
- **No pagination:** All appointments render for a date (may be slow with 100+ appointments)
- **No timezone handling:** Single clinic timezone assumed
- **No multi-doctor support:** Single physician workflow (F2 spec scope)
- **No appointment duration:** Fixed 1-hour slots only
- **No recurring appointments:** Each appointment created individually
- **No email/SMS notifications:** F2 scope non-goal
- **No bulk operations:** No "Cancel all appointments for date" feature

---

## Pre-Implementation Verification Checklist

### Dependencies Available:
- [x] F1 patient storage accessible and functional
- [x] F1 patient data includes name, contact fields
- [x] localStorage API accessible in target browsers
- [x] Bootstrap CSS included in project

### Plan Structure Valid:
- [x] Steps 1-16 are revertible independently
- [x] Each step modifies/creates only one file (or one logical module)
- [x] No circular dependencies between steps
- [x] Integration points clearly documented (F1 linkage)

### Requirements Covered:
- [x] Appointment creation with patient, date, time
- [x] Conflict detection (prevent double-booking)
- [x] Daily schedule view with filtering by date
- [x] Appointment edit/update capability
- [x] Appointment cancel with status soft-delete
- [x] Status transitions (Scheduled → Completed/Cancelled)
- [x] localStorage persistence across page reloads
- [x] Both F2 spec acceptance criteria addressed

### Design Decisions Finalized:
- [x] 1-hour fixed slot duration (no user-specified duration)
- [x] 24-hour time format (HH:MM)
- [x] Cancelled status does not block time slots
- [x] Soft delete (status change, not hard delete)
- [x] Patient reassignment allowed during edit
- [x] Alternative slots suggested on conflict
- [x] href-based navigation (consistent with F1)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| localStorage quota exceeded | Monitor localStorage usage; warn user if quota approaching 90% |
| Concurrent browser tabs conflict | Accept limitation; document that same appointment should not be edited in multiple tabs simultaneously |
| Patient data deleted while appointment exists | Handle gracefully: show "Unknown Patient" in schedule; allow cancelling orphaned appointments |
| Date/time picker browser compatibility | Provide fallback text inputs; test in target browser before release |
| Performance with 100+ appointments | Implement pagination in future (F2+ enhancement); current scope MVP only |
| Double-submit race condition | Disable submit button on first click; disable for 2 seconds after submit |
| Invalid appointment ID in URL | Display error message; provide link back to safe page (daily schedule) |

---

## Dependencies

- **F1 (Patient Profile Management)** — Must be completed first; F2 depends on patient storage, patient list, and patient lookup functionality
- **Browser localStorage API** — Must support ~5MB+ data storage
- **Bootstrap 4/5 CDN** — For form & UI styling (must be same version as F1)
- **HTML5 date/time inputs** — Supported in modern browsers

---

## Status

✅ **REFACTORED & READY FOR IMPLEMENTATION**

**Key Improvements in This Refactoring:**
1. ✅ Split Step 8 (loader + renderer) into Step 8 (loader only) and Step 9 (action handlers) for better step revertibility
2. ✅ Added Dependencies & Integration Points section
3. ✅ Added Key Design Decisions at top
4. ✅ Added complete Implementation Sequence with timeline (4-5 days)
5. ✅ Added Relevant Files summary with all 13 new files + 3 modified files
6. ✅ Added Pre-Implementation Verification Checklist (8 categories, 22 items)
7. ✅ Reorganized Risk Mitigation table
8. ✅ Renumbered all steps after split (Steps 10-16 adjusted)

**All design decisions finalized. No further questions needed.**

---

## Notes for Implementer

1. **Start with Step 1-2:** Build storage layer and data model first; all other steps depend on these
2. **Test conflict detection thoroughly:** This is the most complex logic; verify with multiple scenarios
3. **Keep F1 integration points minimal:** Avoid tight coupling; use localStorage lookups only
4. **CSS consistency:** Check F1 styles first to match design patterns
5. **User feedback:** Show loading states during patient lookup; error messages for all failure modes
6. **Browser DevTools:** Regularly inspect localStorage to verify appointment records are saved correctly
