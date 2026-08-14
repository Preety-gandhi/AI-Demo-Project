# Plan: F6 — Patient Search and Navigation

## Source
**Reference:** [specs/features/PatientManagement.feature.md](../../specs/features/PatientManagement.feature.md) | F6 — Patient Search and Navigation

**Spec Location:** [specs/F6_Patient_Search_and_Navigation.md](../../specs/F6_Patient_Search_and_Navigation.md)

---

**TL;DR:** Add patient search functionality to the F1 patient management system. Build a search index utility for efficient 10-digit phone/name searching with relevance scoring and sorting by recent activity, create a dedicated search page with keystroke-triggered live search and paginated results (20 per page), handle no-results state with new patient creation prompt, and integrate search navigation throughout the application. All using localStorage (F1's existing data source) with JavaScript utilities.

---

## Current State Analysis
- **F1 Status:** Patient Profile Management planned/implemented with localStorage persistence
- **Data Model:** Patient class includes: id, name, DOB, gender, contact, email, address, bloodGroup, createdAt, updatedAt
- **Storage Location:** `frontend/js/storage.js` provides patient CRUD operations
- **Navigation:** Manual href-based navigation using HTML links
- **UI Framework:** Bootstrap for styling

---

## Implementation Steps

### Phase 1: Foundation & Search Infrastructure

**Step 1 — Create patient search utility module** (`frontend/js/utils/patientSearch.js`)
- **Files changed:** 
  - Create: `frontend/js/utils/patientSearch.js` (new file)
- **What:** 
  - Function `searchPatients(query)` - searches by patient name or 10-digit phone number
  - Function `calculateRelevanceScore(patient, query)` - scoring logic:
    - Exact name match: +100 points
    - Name starts with query: +50 points
    - Name contains query: +25 points
    - Contact (phone) exact match (all 10 digits): +75 points
    - Contact contains query (partial phone match): +40 points
  - Function `sortByRelevanceAndActivity(results)` - sorts by relevance score (desc), then by updatedAt (desc) for recent activity
  - Function `normalizeSearchQuery(query)` - trim, lowercase, remove non-alphanumeric for case-insensitive searching
  - Function `normalizePhoneNumber(phone)` - extract 10 digits from any phone format
- **Risks:**
  - Search performance could degrade with large patient lists (1000+ patients); pagination mitigates by loading one page at a time
  - Phone number format: assumes stored as 10-digit string (9876543210)
- **Assumptions:**
  - F1 patient storage utilities already exist and expose `getAllPatients()`
  - Patient phone numbers stored in `contact` field as 10-digit strings (e.g., "9876543210")
  - Patient names stored in `name` field
- **How to verify:**
  - Test search with exact name matches → top result
  - Test search with partial name → results contain matching patients sorted by relevance
  - Test search by 10-digit phone ("9876543210") → exact phone match appears first
  - Test search by partial phone ("987") → partial matches appear in results
  - Test search case-insensitivity → "john" finds "John"
  - Test relevance scoring → exact matches appear before partial matches
  - Test empty results → function returns empty array (no errors)

---

**Step 2 — Create pagination utility module** (`frontend/js/utils/pagination.js`)
- **Files changed:**
  - Create: `frontend/js/utils/pagination.js` (new file)
- **What:**
  - Function `paginate(results, pageNumber, pageSize)` - splits results array into pages, returns object with:
    - `items` (array of patients for current page)
    - `totalPages` (total number of pages)
    - `currentPage` (current page number)
    - `totalResults` (total count of results)
  - Function `getCurrentPageInfo()` - helper to get current pagination state
  - Default page size: 20 records per page
- **Risks:** None
- **Assumptions:** Results array is pre-sorted by relevance and activity
- **How to verify:**
  - Paginate 50 results, pageSize=20 → totalPages=3, page 1 has items 0-19, page 2 has items 20-39, page 3 has items 40-49
  - Request page 5 of 3 → error handling or return empty
  - Verify totalResults matches array length

---

### Phase 2: Search UI & Form

**Step 3 — Create search form HTML page** (`frontend/html/search-patients.html`)
- **Files changed:**
  - Create: `frontend/html/search-patients.html` (new file)
- **What:**
  - Page header with link back to patient list
  - Search form with:
    - Text input for query (placeholder: "Search by patient name or 10-digit phone")
    - No submit button needed (keystroke-triggered live search)
    - Clear button to reset
  - Sort dropdown with options: Relevance (default), Recent Activity, Name (A-Z), Name (Z-A)
  - Search results container (initially empty)
  - Pagination controls (Previous/Next buttons, page indicator, jump-to-page input)
  - No-results message container (initially hidden)
  - Bootstrap styling matching F1 design
- **Risks:**
  - Layout must match F1 styling for consistency; requires review of F1 CSS
  - Pagination controls must not clutter UI with large result sets
- **Assumptions:**
  - Same Bootstrap version used as F1
  - Navigation uses href to this page
- **How to verify:**
  - Render page in browser → form displays correctly and is responsive
  - Sort dropdown visible and functional
  - Pagination controls visible below results
  - Styling matches patient-list.html

---

**Step 4 — Create search form handler with live search** (`frontend/js/forms/searchPatientsForm.js`)
- **Files changed:**
  - Create: `frontend/js/forms/searchPatientsForm.js` (new file)
- **What:**
  - Event listener on search input `keyup` event (keystroke-triggered live search):
    - Get query from input field
    - Debounce with 300ms delay to avoid excessive searches
    - If query length > 0: call `patientSearch.searchPatients(query)`
    - Call `sortByRelevanceAndActivity(results)`
    - Call `pagination.paginate(results, 1, 20)` (start at page 1)
    - Call `renderSearchResults(paginatedResults.items)` and show pagination controls
    - If no results: show no-results message and hide pagination
    - Update page indicator (e.g., "Page 1 of 5")
  - If query is empty: clear results and hide no-results message
  - Event listener on clear button click:
    - Clear input field
    - Hide results, no-results containers, and pagination controls
    - Set focus back to input
  - Event listener on sort dropdown change:
    - Get new sort option (Relevance, Recent Activity, Name A-Z, Name Z-A)
    - Re-sort current results based on selection
    - Reset to page 1
    - Re-render results
  - Event listener on pagination buttons (Previous/Next, jump-to-page)
    - Update current page
    - Call `pagination.paginate()` with new page number
    - Re-render results
    - Scroll to top of results
- **Risks:**
  - Debouncing logic must prevent race conditions; use timestamp or flag
  - Keystroke search may feel slow with 1000+ patient dataset (but pagination mitigates)
- **Assumptions:**
  - `patientSearch.js` exports searchPatients and sortByRelevanceAndActivity functions
  - `pagination.js` exports paginate function
  - DOM elements have consistent IDs for targeting
- **How to verify:**
  - Type "john" in search box → results appear after 300ms
  - Continue typing "john d" → results update (only one search executes per keystroke batch)
  - Clear query → results disappear
  - Select "Name A-Z" sort → results re-render sorted by name
  - Click Next → page 2 displays, scroll to top
  - Click Previous → page 1 displays

---

### Phase 3: Search Results Display

**Step 5 — Create search results renderer** (`frontend/js/ui/searchResultsRenderer.js`)
- **Files changed:**
  - Create: `frontend/js/ui/searchResultsRenderer.js` (new file)
- **What:**
  - Function `renderSearchResults(results)` - takes array of patient objects and renders:
    - For each result: row with patient name, contact, DOB, gender, and action buttons (View/Edit/Delete)
    - Table format (matching F1's patient-list.html structure)
    - No relevance score display (removed per user feedback)
  - Function `renderPaginationControls(totalPages, currentPage)` - renders:
    - Previous button (disabled on page 1)
    - Page indicator "Page X of Y"
    - Next button (disabled on last page)
    - Jump-to-page input (optional: enter page number and press Enter)
  - Function `clearSearchResults()` - empty results container and pagination controls
- **Risks:**
  - Pagination rendering on every page change must be smooth (no lag)
- **Assumptions:**
  - Results container has consistent DOM ID
  - View/Edit buttons use same URL patterns as F1
  - Pagination container has consistent DOM ID
- **How to verify:**
  - Search for "John" → displays matching patients in table
  - 30 results on 20-per-page → shows "Page 1 of 2", Previous disabled, Next enabled
  - Click Next → displays results 21-30, shows "Page 2 of 2", Previous enabled, Next disabled
  - Click View button → navigates to patient profile (F1 functionality)

---

**Step 6 — Create no-results message component** (`frontend/html/components/noResultsMessage.html`)
- **Files changed:**
  - Create: `frontend/html/components/noResultsMessage.html` (new file)
- **What:**
  - Reusable HTML component (can be embedded in search-patients.html):
    - Message: "No patients found matching '[query]'"
    - Link: "Create a new patient" pointing to `add-patient.html`
    - Styling: Alert box (Bootstrap alert-info)
  - Alternative: Could be inline HTML in search-patients.html
- **Risks:** None
- **Assumptions:** Consistent with F1 design patterns
- **How to verify:**
  - Component displays when no results found
  - Link to add-patient.html works correctly

---

### Phase 4: Navigation & Integration

**Step 7 — Add search link to patient list page** (modify `frontend/html/patient-list.html`)
- **Files changed:**
  - Modify: `frontend/html/patient-list.html`
- **What:**
  - Add search button/link in header near "Add Patient" button
  - Button text: "Search Patients" or magnifying glass icon
  - href: `search-patients.html`
  - Styling consistent with "Add Patient" button
- **Risks:**
  - Layout spacing may need adjustment
  - Button sizing must match existing buttons
- **Assumptions:** Bootstrap button styling already applied
- **How to verify:**
  - Search button visible on patient-list.html
  - Button is clickable and navigates to search-patients.html
  - Button styling matches other buttons on page

---

**Step 8 — Add search link to patient view/edit pages** (modify `frontend/html/view-patient.html` and `frontend/html/edit-patient.html`)
- **Files changed:**
  - Modify: `frontend/html/view-patient.html`
  - Modify: `frontend/html/edit-patient.html`
- **What:**
  - Add "Back to Search" or "Find Another Patient" button in header or footer
  - href: `search-patients.html`
  - Allows physician to quickly search for another patient after viewing/editing current patient
  - Alternative: "Return to Patient List" button already exists (can enhance with search option)
- **Risks:** None
- **Assumptions:** Button areas already have space for additional navigation
- **How to verify:**
  - Button visible on both view and edit pages
  - Clicking navigates to search page
  - Button styling consistent

---

**Step 9 — Update navigation main shell** (modify `frontend/html/index.html`)
- **Files changed:**
  - Modify: `frontend/html/index.html`
- **What:**
  - Add link to search-patients.html in main navigation or landing page
  - Update nav menu if applicable
  - Ensure search is easily discoverable from landing page
- **Risks:** None
- **Assumptions:** index.html already has a navigation structure
- **How to verify:**
  - Link visible on index.html
  - Link navigates to search-patients.html

---

### Phase 5: Sorting & Sorting Logic

**Step 10 — Create sorting utility module** (`frontend/js/utils/sorting.js`)
- **Files changed:**
  - Create: `frontend/js/utils/sorting.js` (new file)
- **What:**
  - Function `sortByRelevance(results)` - already calculated in searchPatients, just return
  - Function `sortByRecentActivity(results)` - sort by updatedAt timestamp descending
  - Function `sortByNameAZ(results)` - sort by patient.name ascending
  - Function `sortByNameZA(results)` - sort by patient.name descending
  - Function `applySortOption(results, sortOption)` - dispatcher function that calls appropriate sort function
- **Risks:** None
- **Assumptions:** Results array has required fields (updatedAt, name)
- **How to verify:**
  - Sort results by recent activity → most recent first
  - Sort results by name A-Z → alphabetical order
  - Sort results by name Z-A → reverse alphabetical order

---

### Phase 6: Testing & Validation

**Step 11 — Create test data** (helper: `frontend/js/dev/createTestPatients.js`)
- **Files changed:**
  - Create: `frontend/js/dev/createTestPatients.js` (development-only helper)
- **What:**
  - Script to populate localStorage with 20-50 test patients for manual testing
  - Includes various name patterns (John, Jane, common/rare names)
  - Includes various 10-digit phone numbers (e.g., 9876543210, 5551234567)
  - Can be run in browser console: `createTestPatients(50)`
  - Helpful for testing search relevance, pagination, and performance
- **Risks:** None (development-only)
- **Assumptions:** Used during testing phase only, removed or disabled in production
- **How to verify:**
  - Run script → localStorage contains 50 patients
  - Patient-list.html shows all 50 patients
  - Search returns results with pagination

---

## Acceptance Criteria Verification

### Scenario 1: Happy Path Search
**Given** the physician types a full or partial patient name or phone number in search  
**When** they execute the search  
**Then** matching patient records are returned sorted by relevance and recent activity

**Verification Steps:**
1. Open search-patients.html
2. Type "John" → search
3. Verify results include all patients with "John" in name
4. Verify results sorted by relevance (exact name match first, then partial matches)
5. Verify multiple results with same relevance score sorted by updatedAt (most recent first)
6. Type "555-1234" (phone) → search
7. Verify phone matches appear in results with phone match indicator
8. Verify exact phone match appears first

### Scenario 2: No Results
**Given** the physician searches for a non-existent patient  
**When** they execute the search  
**Then** the system shows a "no results found" message and suggests creating a new patient

**Verification Steps:**
1. Open search-patients.html
2. Type "ZZZZZZZZ" (non-existent) → search
3. Verify no results displayed
4. Verify "No patients found" message appears
5. Verify "Create a new patient" link visible in message
6. Click "Create a new patient" → navigates to add-patient.html
7. Verify form ready for new patient creation

---

## Implementation Dependencies

| Step | Depends On | Notes |
|------|-----------|-------|
| 1 | F1 storage.js | Must have getAllPatients() function |
| 2 | Step 1 | Pagination utility |
| 3 | F1 patient-list.html | HTML/CSS style reference |
| 4 | Steps 1, 2, 3 | Search form handler with live search |
| 5 | Steps 2, 4 | Results renderer with pagination UI |
| 6 | Steps 3, 5 | No-results component |
| 7 | F1 patient-list.html | Modify existing file |
| 8 | F1 view/edit pages | Modify existing files |
| 9 | F1 index.html | Modify existing file |
| 10 | Steps 4, 5 | Sorting utility |
| 11 | Steps 1-5 | Testing only |

---

## Risk & Mitigation Summary

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Search performance degrades with large patient lists | Low | Pagination limits each render to 20 results; search still O(n) but acceptable |
| Phone number format inconsistency | Low | Normalized to 10-digit format; search utility handles normalization |
| Debounce race condition during live search | Low | Use timestamp flag to ensure only latest query executes |
| localStorage data loss on cache clear | Low | User education in help docs; can add import/export in Phase 3 |
| Browser localStorage 5-10MB limit | Low | Not a concern for typical clinic size (1000 patients ≈ 500KB) |
| Results rendering lag with pagination | Low | Each page renders only 20 results; smooth performance expected |

---

## Files Checklist

### New Files to Create
- `frontend/js/utils/patientSearch.js` — Search index with 10-digit phone and name matching
- `frontend/js/utils/pagination.js` — Pagination logic (20 per page)
- `frontend/js/utils/sorting.js` — Sorting functions (Relevance, Recent Activity, Name A-Z/Z-A)
- `frontend/html/search-patients.html` — Search form with keystroke live search, sort dropdown, pagination controls, results table
- `frontend/js/forms/searchPatientsForm.js` — Live search handler, sort handler, pagination handler
- `frontend/js/ui/searchResultsRenderer.js` — Results table renderer and pagination UI renderer
- `frontend/html/components/noResultsMessage.html` — No-results component
- `frontend/js/dev/createTestPatients.js` — Test data helper (development-only)

### Files to Modify
- `frontend/html/patient-list.html` — Add search button
- `frontend/html/view-patient.html` — Add navigation to search
- `frontend/html/edit-patient.html` — Add navigation to search
- `frontend/html/index.html` — Update main navigation

### No Changes Required
- `frontend/js/storage.js` — F1 storage already supports getAllPatients()
- `frontend/js/models/patient.js` — F1 patient model already has name, contact fields

---

## Estimated Effort

- **Phase 1 (Search Infrastructure):** 2-3 hours (patientSearch.js, pagination.js, 10-digit phone handling)
- **Phase 2 (Search UI & Live Search):** 3-4 hours (HTML form, keystroke-triggered live search with debounce, form handler)
- **Phase 3 (Results Display & Pagination UI):** 2-3 hours (results table renderer, pagination controls, page navigation)
- **Phase 4 (Navigation Integration):** 1 hour (add links to patient-list, view, edit, index pages)
- **Phase 5 (Sorting):** 1 hour (sorting utility, sort dropdown handler, re-sort on change)
- **Phase 6 (Testing & Polish):** 1-2 hours (test data helper, manual testing, edge cases)

**Total Effort:** 10-13 hours (all features included, no "optional" phases)

---

## User-Approved Decisions

✅ **Search Scale:** Pagination with 20 records per page implemented in Phase 1

✅ **Phone Number Format:** 10-digit mobile numbers (e.g., `9876543210`) — search utility handles normalization

✅ **Live Search:** Keystroke-triggered search with 300ms debounce implemented in Phase 1

✅ **Score Visibility:** Relevance score removed from UI (backend calculation only) for clean interface

✅ **Navigation:** Search results cleared when navigating away (no history retention)

✅ **Sort Options:** Multiple sort options included in Phase 1 (Relevance, Recent Activity, Name A-Z, Name Z-A)

