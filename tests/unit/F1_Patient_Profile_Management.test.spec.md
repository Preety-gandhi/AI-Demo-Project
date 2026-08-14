# Test Specification: F1 — Patient Profile Management
**Source Spec:** `.github/specs/F1_Patient_Profile_Management.md`

---

## Test Cases Summary

This document defines all test cases for F1 (Patient Profile Management) mapped to each Acceptance Criteria (AC). All tests follow the **Given/When/Then** format and are designed to be:
- **Binary**: Pass or Fail with no ambiguity
- **Independent**: Each test can run alone without depending on others
- **Traceable**: Each test ID references its source AC

---

## Acceptance Criteria Mapping

### AC1: Create patient profile
**Source:** Scenario 1 — Create patient profile  
**Focus:** Happy path for creating a patient with valid details

#### Test: `test_AC1_create_patient_with_valid_details`
```
Given: A physician is on the patient registration screen
  AND the registration form is displayed with fields:
    - Name (required)
    - Contact (required)
    - Date of Birth (optional)
    - Gender (optional)
    - Address (optional)
  AND no patient data has been entered yet

When: The physician enters valid patient details:
  - Name: "John Doe"
  - Contact: "1234567890"
  AND the physician clicks the "Submit" or "Save" button

Then: The system should:
  - Validate that all required fields contain valid data
  - Save the new patient profile to the patient database/store
  - Redirect/display the patient list
  - The newly created patient should appear in the patient list
  - A success message should be displayed to the physician
  - Form should be cleared or reset for next entry
```

**Mocks/Fixtures:**
- Mock patient database/store (in-memory or mock adapter)
- Mock patient registration form with initial empty state
- Mock navigation/display system to show patient list
- Valid sample patient data: `{ name: "John Doe", contact: "1234567890" }`

**Binary Pass/Fail:**
- ✓ **PASS**: Patient appears in list AND success message shown
- ✗ **FAIL**: Patient not in list OR success message missing

---

#### Test: `test_AC1_create_patient_with_minimum_required_fields`
```
Given: A physician is on the patient registration screen
  AND only Name and Contact fields are marked as required

When: The physician enters only the minimum required fields:
  - Name: "Jane Smith"
  - Contact: "9876543210"
  AND all optional fields (DOB, Gender, Address) are left empty
  AND the physician submits the form

Then: The system should:
  - Accept and validate the form submission
  - Save the patient profile with only required fields populated
  - Display the patient in the patient list with available data
  - NOT reject the submission due to empty optional fields
```

**Mocks/Fixtures:**
- Mock patient store
- Form state with Name and Contact populated, others empty
- Valid contact number format

**Binary Pass/Fail:**
- ✓ **PASS**: Patient saved and visible in list with partial data
- ✗ **FAIL**: Form rejected OR patient not saved

---

#### Test: `test_AC1_create_patient_with_all_optional_fields`
```
Given: A physician is on the patient registration screen
  AND all form fields are available (required + optional)

When: The physician enters complete patient details:
  - Name: "Robert Brown"
  - Contact: "5554443333"
  - Date of Birth: "1985-03-15"
  - Gender: "Male"
  - Address: "123 Main St, Springfield"
  AND the physician submits the form

Then: The system should:
  - Validate all entered data
  - Save the complete patient profile with all fields
  - Display the patient with all entered details in the patient list
  - Preserve all optional fields in the stored profile
```

**Mocks/Fixtures:**
- Complete patient data fixture
- Mock patient store with schema supporting all fields
- Date format validator mock

**Binary Pass/Fail:**
- ✓ **PASS**: All fields saved and retrievable
- ✗ **FAIL**: Any field missing or lost

---

#### Test: `test_AC1_create_patient_with_special_characters_in_name`
```
Given: A physician is on the patient registration screen

When: The physician enters a patient name with special characters:
  - Name: "O'Brien-José García"
  - Contact: "1112223333"
  AND the physician submits the form

Then: The system should:
  - Accept names containing apostrophes, hyphens, accented characters
  - Save the name exactly as entered
  - Display the name correctly in the patient list
  - NOT reject or sanitize the name
```

**Mocks/Fixtures:**
- Special character test data for Name field
- Character encoding handler mock

**Binary Pass/Fail:**
- ✓ **PASS**: Name saved and displayed exactly
- ✗ **FAIL**: Name corrupted, rejected, or sanitized

---

#### Test: `test_AC1_create_patient_duplicate_check`
```
Given: A physician is on the patient registration screen
  AND a patient named "Michael Chen" with contact "2224445555" already exists in the system

When: The physician attempts to create a new patient with identical:
  - Name: "Michael Chen"
  - Contact: "2224445555"
  AND submits the form

Then: The system should:
  - Detect the duplicate entry
  - Display a warning/confirmation dialog
  - Provide options to:
    - Cancel and edit the entry
    - Confirm and create as a new record (if allowed)
  - NOT silently create a duplicate without warning
```

**Mocks/Fixtures:**
- Mock patient store with existing "Michael Chen" entry
- Mock dialog/warning system
- Duplicate detection logic

**Binary Pass/Fail:**
- ✓ **PASS**: Duplicate detected AND user warned
- ✗ **FAIL**: Duplicate created silently OR no warning

---

### AC2: Validation — Missing Required Field
**Source:** Scenario 2 — Validation - missing required field  
**Focus:** Form validation for required fields (Name, Contact)

#### Test: `test_AC2_submit_form_with_empty_name_field`
```
Given: A physician is on the patient registration screen
  AND the registration form is displayed
  AND the Name field is empty (no text entered)

When: The physician enters a Contact value:
  - Contact: "3335556666"
  AND leaves the Name field empty
  AND clicks the "Submit" or "Save" button

Then: The system should:
  - Block the form submission
  - Display a validation error message specifically for the Name field
  - The error message should indicate "Name is required" or similar
  - The form state should not change (data not cleared)
  - The patient record should NOT be created
  - Focus should remain on or navigate to the Name field (optional: good UX)
```

**Mocks/Fixtures:**
- Mock form validation system
- Empty Name field state
- Mock error message display
- Valid contact for testing

**Binary Pass/Fail:**
- ✓ **PASS**: Submission blocked AND error message shown for Name
- ✗ **FAIL**: Form submitted OR no error shown

---

#### Test: `test_AC2_submit_form_with_empty_contact_field`
```
Given: A physician is on the patient registration screen
  AND the registration form is displayed
  AND the Contact field is empty (no text entered)

When: The physician enters a Name value:
  - Name: "Sarah Johnson"
  AND leaves the Contact field empty
  AND clicks the "Submit" or "Save" button

Then: The system should:
  - Block the form submission
  - Display a validation error message specifically for the Contact field
  - The error message should indicate "Contact is required" or similar
  - The form state should not change (data not cleared)
  - The patient record should NOT be created
  - Focus should remain on or navigate to the Contact field (optional: good UX)
```

**Mocks/Fixtures:**
- Mock form validation system
- Empty Contact field state
- Valid Name for testing
- Mock error message display

**Binary Pass/Fail:**
- ✓ **PASS**: Submission blocked AND error message shown for Contact
- ✗ **FAIL**: Form submitted OR no error shown

---

#### Test: `test_AC2_submit_form_with_both_name_and_contact_empty`
```
Given: A physician is on the patient registration screen
  AND the registration form is displayed
  AND both Name and Contact fields are empty

When: The physician clicks the "Submit" or "Save" button without entering any data

Then: The system should:
  - Block the form submission
  - Display validation error messages for both Name and Contact fields
  - Indicate both fields are required
  - The form state should not change
  - The patient record should NOT be created
  - All errors should be visible to the physician at once (not one at a time)
```

**Mocks/Fixtures:**
- Mock form validation system with multi-field validation
- Both fields in empty state
- Mock error aggregation/display

**Binary Pass/Fail:**
- ✓ **PASS**: Submission blocked AND errors shown for both fields
- ✗ **FAIL**: One/both errors missing OR form submitted

---

#### Test: `test_AC2_submit_form_with_whitespace_only_name`
```
Given: A physician is on the patient registration screen
  AND the registration form is displayed

When: The physician enters only whitespace in the Name field:
  - Name: "   " (spaces only)
  - Contact: "7778889999"
  AND clicks the "Submit" or "Save" button

Then: The system should:
  - Treat whitespace-only input as empty/invalid
  - Block the form submission
  - Display a validation error for the Name field
  - The error message should indicate Name cannot be empty or whitespace
  - The patient record should NOT be created
```

**Mocks/Fixtures:**
- Whitespace handling/trimming logic in validator
- Valid Contact for testing
- Form state with whitespace-only Name

**Binary Pass/Fail:**
- ✓ **PASS**: Whitespace rejected AND error shown
- ✗ **FAIL**: Whitespace accepted OR form submitted

---

#### Test: `test_AC2_submit_form_with_whitespace_only_contact`
```
Given: A physician is on the patient registration screen
  AND the registration form is displayed

When: The physician enters only whitespace in the Contact field:
  - Name: "Emily Davis"
  - Contact: "   " (spaces only)
  AND clicks the "Submit" or "Save" button

Then: The system should:
  - Treat whitespace-only input as empty/invalid
  - Block the form submission
  - Display a validation error for the Contact field
  - The patient record should NOT be created
```

**Mocks/Fixtures:**
- Whitespace handling/trimming logic in validator
- Valid Name for testing
- Form state with whitespace-only Contact

**Binary Pass/Fail:**
- ✓ **PASS**: Whitespace rejected AND error shown
- ✗ **FAIL**: Whitespace accepted OR form submitted

---

#### Test: `test_AC2_clear_validation_error_on_field_input`
```
Given: A physician is on the patient registration screen
  AND a validation error is displayed for the Name field
  - Error message: "Name is required"

When: The physician types a valid name in the Name field:
  - Name: "Thomas Wilson"

Then: The system should:
  - Clear the validation error for the Name field
  - Update the error display to remove the error message
  - The field should be marked as valid
  - Allow the form to be submitted once all required fields are filled
```

**Mocks/Fixtures:**
- Form with initial validation error state
- Form validation/error clearing system
- Real-time validation feedback mock

**Binary Pass/Fail:**
- ✓ **PASS**: Error cleared when field populated
- ✗ **FAIL**: Error persists or field still marked invalid

---

## Fixtures & Mocks Reference

### Patient Data Fixtures
```
VALID_PATIENT_DATA: {
  name: "John Doe",
  contact: "1234567890"
}

VALID_PATIENT_DATA_FULL: {
  name: "Robert Brown",
  contact: "5554443333",
  dateOfBirth: "1985-03-15",
  gender: "Male",
  address: "123 Main St, Springfield"
}

SPECIAL_CHAR_PATIENT: {
  name: "O'Brien-José García",
  contact: "1112223333"
}

DUPLICATE_PATIENT: {
  name: "Michael Chen",
  contact: "2224445555"
}

INVALID_PATIENTS: {
  empty_name: { name: "", contact: "3335556666" },
  empty_contact: { name: "Sarah Johnson", contact: "" },
  empty_both: { name: "", contact: "" },
  whitespace_name: { name: "   ", contact: "7778889999" },
  whitespace_contact: { name: "Emily Davis", contact: "   " }
}
```

### Core Mocks
1. **Patient Store/Database Mock**
   - Methods: `save(patient)`, `getAll()`, `findByNameAndContact()`
   - Should return promises for async operations
   - Should support querying for duplicate detection

2. **Form Validation Mock**
   - Methods: `validateRequired(field)`, `validateAll(formData)`, `clearError(field)`
   - Should return validation results with field-level errors
   - Should support multi-field validation

3. **Error Display Mock**
   - Methods: `showError(message)`, `clearError()`, `showErrors(fieldErrors)`
   - Should track displayed errors
   - Should support field-scoped error display

4. **Navigation/List Display Mock**
   - Methods: `displayPatientList(patients)`, `showSuccessMessage(msg)`
   - Should render patient list correctly
   - Should display success confirmations

---

## Test Independence & Execution

Each test is designed to:
- ✓ Run in any order
- ✓ Not depend on shared state
- ✓ Reset mocks before each test
- ✓ Assert only binary outcomes (pass/fail)
- ✓ Use isolated fixtures

**Setup for each test:**
```
- Clear/reset patient store
- Reset form to initial state
- Clear error displays
- Reload form component/module
```

**Teardown for each test:**
```
- Reset all mocks
- Clear form state
- Remove any test data from store
```

---

## Test Implementation Order (Recommended)

1. `test_AC1_create_patient_with_valid_details` — Core happy path
2. `test_AC1_create_patient_with_minimum_required_fields` — Minimal valid input
3. `test_AC2_submit_form_with_empty_name_field` — Name validation
4. `test_AC2_submit_form_with_empty_contact_field` — Contact validation
5. `test_AC2_submit_form_with_both_name_and_contact_empty` — Multi-field validation
6. `test_AC2_submit_form_with_whitespace_only_name` — Edge case: whitespace
7. `test_AC2_submit_form_with_whitespace_only_contact` — Edge case: whitespace
8. `test_AC1_create_patient_with_all_optional_fields` — Extended happy path
9. `test_AC1_create_patient_with_special_characters_in_name` — Data handling edge case
10. `test_AC1_create_patient_duplicate_check` — Business logic edge case
11. `test_AC2_clear_validation_error_on_field_input` — UX feedback test

---

## Notes
- All tests use **Gherkin-style Given/When/Then** for clarity and traceability
- No implementation code is included — this is specification only
- Each test validates one specific behavior (Single Responsibility)
- Tests are designed for Vitest (unit) + Playwright (e2e) stack from TEST_STACK_SETUP_GUIDE.md
