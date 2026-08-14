# Plan: F1 — Patient Profile Management

## Source
**Reference:** [.github/specs/features/PatientManagement.feature.md](../../.github/specs/features/PatientManagement.feature.md) | F1 — Patient Profile Management

**Spec Location:** [.github/specs/F1_Patient_Profile_Management.md](../../.github/specs/F1_Patient_Profile_Management.md)

---

**TL;DR:** Create a patient profile management system using HTML/Bootstrap frontend with browser localStorage persistence. Implement patient creation with validation, a patient list view, patient profile viewing, and profile editing. No backend API — all data stored in localStorage with JavaScript utility functions.

---

## Implementation Steps

### Phase 1: Foundation & Project Structure

**Step 1 — Create project directory structure**
- Files: Initialize `/frontend` (html, css, js folders) and `/backend` directories
- Risk: None
- Verify: Directory structure visible in file explorer

**Step 2 — Create localStorage utility module** (`frontend/js/storage.js`)
- What: Functions for `save()`, `load()`, `delete()`, `getAllPatients()`, `getPatientById()`, `updatePatient()`
- Serializes/deserializes patient JSON objects to/from localStorage
- Risk: ~5-10MB storage limit; data loss if browser cache cleared
- Verify: Test localStorage operations manually or with unit tests

### Phase 2: Data Model & Patient Form

**Step 3 — Create patient data model** (`frontend/js/models/patient.js`)
- What: Patient class with fields: id (UUID), name, DOB, gender, contact, email, address, bloodGroup, createdAt, updatedAt
- Includes validation logic for required fields (name, contact) and format validation (email)
- Risk: Manual validation required (no framework)
- Verify: Create test patient objects; verify all fields exist and types are correct

**Step 4 — Create Add Patient form** (`frontend/html/add-patient.html`)
- What: HTML form with Bootstrap for fields: name (required), DOB, gender, contact (required), email, address, bloodGroup
- Submit button calls validation handler; cancel returns to patient list
- Risk: HTML5 validation may miss edge cases
- Verify: Valid data → saves; missing required fields → error blocks submit; invalid email → error displays

**Step 5 — Create form validation & submission handler** (`frontend/js/forms/addPatientForm.js`)
- What: Validates form fields (required, format), displays errors inline, saves to localStorage
- Generates unique patient ID on submit
- Risk: Double-submit race condition; disable button on first click
- Verify: Test valid/invalid data; confirm patient in localStorage

### Phase 3: Patient List & Viewing

**Step 6 — Create Patient List view** (`frontend/html/patient-list.html`)
- What: Table displaying all patients (name, contact, DOB, gender, actions: View/Edit/Delete)
- "Add Patient" button links to add-patient form
- Loads patients from localStorage on page load
- Risk: No pagination (may slow with many patients)
- Verify: Add 5+ patients; list displays all correctly; View/Edit buttons navigate properly

**Step 7 — Create patient list loader** (`frontend/js/patientList.js`)
- What: Load patients from localStorage, render table rows, handle empty state
- Risk: None
- Verify: Render with 0, 1, and multiple patients

**Step 8 — Create View Patient Profile screen** (`frontend/html/view-patient.html`)
- What: Read-only display of single patient record; Edit and Back buttons
- Gets patient ID from URL parameter (`?id=<patientId>`)
- Risk: Missing/invalid patient ID → error handling required
- Verify: Valid ID → shows patient; invalid ID → shows error

**Step 9 — Create view patient loader** (`frontend/js/viewPatient.js`)
- What: Get patient ID from URL, retrieve from localStorage, populate HTML
- Risk: ID not found or missing from URL
- Verify: Test with valid and invalid patient IDs

### Phase 4: Patient Update

**Step 10 — Create Edit Patient form** (`frontend/html/edit-patient.html`)
- What: Same as add-patient.html but pre-populated with existing patient data
- Gets patient ID from URL; submit updates localStorage
- Risk: Concurrent edit race conditions (no locking)
- Verify: Pre-fill works; modifications save; changes persist on reload

**Step 11 — Create edit form handler** (`frontend/js/forms/editPatientForm.js`)
- What: Pre-populate form, validate on submit, call `storage.updatePatient()`
- Risk: Double-submit; localStorage race conditions
- Verify: Edit patient → save → view shows updates; invalid data → blocked

### Phase 5: Delete & Polish

**Step 12 — Add delete patient functionality** (modify `frontend/js/patientList.js`)
- What: Delete button with confirmation dialog; calls `storage.deletePatient()`
- Risk: Accidental deletion; require user confirmation
- Verify: Delete → confirm → patient removed from list and localStorage

**Step 13 — Create main app shell** (`frontend/html/index.html`)
- What: Landing page with link to patient list, header, footer
- Manual href-based navigation (no routing library)
- Risk: Simple navigation may not scale for many pages (F2+)
- Verify: Links work; can navigate between pages

**Step 14 — Add global CSS** (`frontend/css/styles.css`)
- What: Custom styles for forms, tables, alerts; Bootstrap CDN included
- Risk: CSS conflicts with Bootstrap
- Verify: All pages render consistently; polished UI

### Phase 6: Testing & Validation

**Step 15 — Manual acceptance testing**
- Scenario 1: Create patient with valid data → saves and appears in list ✓
- Scenario 2: Leave Name/Contact empty → validation error blocks submission ✓
- Additional: Edit, view, delete all work correctly ✓
- Verify: All acceptance criteria from F1 spec pass

---

## Relevant Files

- `frontend/html/index.html` — Main entry point
- `frontend/html/add-patient.html` — Patient registration form
- `frontend/html/edit-patient.html` — Patient edit form
- `frontend/html/patient-list.html` — Patient list view
- `frontend/html/view-patient.html` — Single patient profile view
- `frontend/js/storage.js` — localStorage CRUD utilities
- `frontend/js/models/patient.js` — Patient data model and validation
- `frontend/js/patientList.js` — Patient list rendering
- `frontend/js/viewPatient.js` — Patient profile view logic
- `frontend/js/forms/addPatientForm.js` — Add patient validation and submission
- `frontend/js/forms/editPatientForm.js` — Edit patient validation and submission
- `frontend/css/styles.css` — Global styles and Bootstrap customization

---

## Verification Steps

1. **Data Model** — Test patient objects have all 9 fields (id, name, DOB, gender, contact, email, address, bloodGroup, timestamps)
2. **localStorage Persistence** — Save → close DevTools → reload page → data persists ✓
3. **Add Patient** — Valid form data → patient in list with correct values ✓
4. **Validation** — Empty required fields → error message blocks submit ✓
5. **Patient List** — Multiple patients display in table correctly ✓
6. **View Profile** — Click View → read-only display of single patient ✓
7. **Edit Patient** — Form pre-fills → modify → save → list shows updates ✓
8. **Delete Patient** — Click delete → confirm → patient removed ✓
9. **Navigation** — All links work correctly ✓
10. **Acceptance Criteria** — Both spec scenarios pass (create + validation) ✓

---

## Key Decisions & Assumptions

- **No backend API:** localStorage only; no Node.js endpoints
- **Manual routing:** href-based navigation with URL parameters (no routing library)
- **HTML5 validation + JS:** Bootstrap forms with JavaScript fallback
- **Single-user, single-browser:** No multi-user sync or cross-device persistence
- **Data loss on cache clear:** No backend backup
- **No automated tests:** Manual testing only (per spec)
- **Patient ID format:** UUID v4 for uniqueness and scalability
- **Empty state:** Shows "No patients found" message
- **Error display:** Bootstrap alert boxes for form and system errors
- **Search/filter:** Not included in MVP (F6 is separate feature)

---

## Status

✅ Plan created and reviewed. Ready for implementation approval.
