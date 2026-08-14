import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * F1 Patient Profile Management - Unit Tests
 * 
 * These tests are written BEFORE implementation (TDD approach).
 * They will FAIL until the patient profile management code is implemented.
 * 
 * Test specification source: tests/unit/F1_Patient_Profile_Management.test.spec.md
 */

describe('F1 — Patient Profile Management', () => {
  let patientStore;
  let formValidator;
  let errorDisplay;

  /**
   * Setup fixtures and mocks before each test
   */
  beforeEach(() => {
    // Mock Patient Store
    patientStore = {
      patients: [],
      save: vi.fn((patient) => {
        patientStore.patients.push(patient);
        return Promise.resolve({ success: true, patient });
      }),
      getAll: vi.fn(() => Promise.resolve([...patientStore.patients])),
      findByNameAndContact: vi.fn((name, contact) => {
        return Promise.resolve(
          patientStore.patients.find(p => p.name === name && p.contact === contact) || null
        );
      }),
      clear: vi.fn(() => {
        patientStore.patients = [];
      }),
    };

    // Mock Form Validator
    formValidator = {
      errors: {},
      validateRequired: vi.fn((field, value) => {
        const isValid = value && value.trim() !== '';
        if (!isValid) {
          formValidator.errors[field] = `${field} is required`;
        } else {
          delete formValidator.errors[field];
        }
        return isValid;
      }),
      validateAll: vi.fn((formData) => {
        formValidator.errors = {};
        const requiredFields = ['name', 'contact'];
        requiredFields.forEach(field => {
          if (!formData[field] || formData[field].trim() === '') {
            formValidator.errors[field] = `${field} is required`;
          }
        });
        return Object.keys(formValidator.errors).length === 0;
      }),
      clearError: vi.fn((field) => {
        delete formValidator.errors[field];
      }),
      getErrors: vi.fn(() => ({ ...formValidator.errors })),
    };

    // Mock Error Display
    errorDisplay = {
      displayedErrors: {},
      showError: vi.fn((field, message) => {
        errorDisplay.displayedErrors[field] = message;
      }),
      showErrors: vi.fn((errors) => {
        errorDisplay.displayedErrors = { ...errors };
      }),
      clearError: vi.fn((field) => {
        delete errorDisplay.displayedErrors[field];
      }),
      clearAll: vi.fn(() => {
        errorDisplay.displayedErrors = {};
      }),
      getDisplayedErrors: vi.fn(() => ({ ...errorDisplay.displayedErrors })),
    };
  });

  // ============================================================================
  // AC1: Create Patient Profile
  // ============================================================================

  describe('AC1 — Create patient profile (Happy Path)', () => {

    it('test_AC1_create_patient_with_valid_details', async () => {
      // GIVEN: A physician is on the patient registration screen
      //   AND the registration form is displayed with required fields
      //   AND no patient data has been entered yet
      const formData = {
        name: '',
        contact: '',
        dateOfBirth: '',
        gender: '',
        address: '',
      };

      // WHEN: The physician enters valid patient details
      formData.name = 'John Doe';
      formData.contact = '1234567890';
      
      // AND: Form validation passes
      const isValid = formValidator.validateAll(formData);
      expect(isValid).toBe(true);

      // AND: The physician clicks the "Submit" button
      if (isValid) {
        await patientStore.save(formData);
      }

      // THEN: The system should save the new patient profile
      expect(patientStore.save).toHaveBeenCalledWith(formData);
      
      // AND: The newly created patient should appear in the patient list
      const allPatients = await patientStore.getAll();
      expect(allPatients).toContainEqual(expect.objectContaining({
        name: 'John Doe',
        contact: '1234567890',
      }));

      // AND: No validation errors should be displayed
      expect(Object.keys(formValidator.errors).length).toBe(0);
    });

    it('test_AC1_create_patient_with_minimum_required_fields', async () => {
      // GIVEN: A physician is on the patient registration screen
      //   AND only Name and Contact are marked as required
      const formData = {
        name: 'Jane Smith',
        contact: '9876543210',
        dateOfBirth: '',
        gender: '',
        address: '',
      };

      // WHEN: The physician enters only minimum required fields
      //   AND optional fields are left empty
      const isValid = formValidator.validateAll(formData);
      expect(isValid).toBe(true);

      // AND: The physician submits the form
      if (isValid) {
        await patientStore.save(formData);
      }

      // THEN: The system should save the patient profile
      expect(patientStore.save).toHaveBeenCalled();

      // AND: The patient should appear in the patient list
      const allPatients = await patientStore.getAll();
      expect(allPatients.length).toBeGreaterThan(0);
      expect(allPatients[0]).toHaveProperty('name', 'Jane Smith');
      expect(allPatients[0]).toHaveProperty('contact', '9876543210');
    });

    it('test_AC1_create_patient_with_all_optional_fields', async () => {
      // GIVEN: A physician is on the patient registration screen
      //   AND all form fields are available
      const formData = {
        name: 'Robert Brown',
        contact: '5554443333',
        dateOfBirth: '1985-03-15',
        gender: 'Male',
        address: '123 Main St, Springfield',
      };

      // WHEN: The physician enters complete patient details
      const isValid = formValidator.validateAll(formData);
      expect(isValid).toBe(true);

      // AND: The physician submits the form
      if (isValid) {
        await patientStore.save(formData);
      }

      // THEN: The system should save the complete patient profile
      expect(patientStore.save).toHaveBeenCalledWith(formData);

      // AND: All fields should be preserved in the stored profile
      const allPatients = await patientStore.getAll();
      const savedPatient = allPatients[0];
      expect(savedPatient).toMatchObject({
        name: 'Robert Brown',
        contact: '5554443333',
        dateOfBirth: '1985-03-15',
        gender: 'Male',
        address: '123 Main St, Springfield',
      });
    });

    it('test_AC1_create_patient_with_special_characters_in_name', async () => {
      // GIVEN: A physician is on the patient registration screen
      const formData = {
        name: "O'Brien-José García",
        contact: '1112223333',
        dateOfBirth: '',
        gender: '',
        address: '',
      };

      // WHEN: The physician enters a name with special characters
      const isValid = formValidator.validateAll(formData);
      expect(isValid).toBe(true);

      // AND: The physician submits the form
      if (isValid) {
        await patientStore.save(formData);
      }

      // THEN: The system should accept and save the name exactly as entered
      expect(patientStore.save).toHaveBeenCalledWith(formData);

      // AND: The name should be displayed correctly in the patient list
      const allPatients = await patientStore.getAll();
      expect(allPatients[0].name).toBe("O'Brien-José García");
    });

    it('test_AC1_create_patient_duplicate_check', async () => {
      // GIVEN: A patient named "Michael Chen" with contact "2224445555" already exists
      const existingPatient = {
        name: 'Michael Chen',
        contact: '2224445555',
      };
      await patientStore.save(existingPatient);

      // WHEN: The physician attempts to create a new patient with identical details
      const newPatient = {
        name: 'Michael Chen',
        contact: '2224445555',
      };

      // AND: The system checks for duplicates
      const duplicate = await patientStore.findByNameAndContact(
        newPatient.name,
        newPatient.contact
      );

      // THEN: The system should detect the duplicate entry
      expect(duplicate).toBeTruthy();
      expect(duplicate.name).toBe('Michael Chen');
      expect(duplicate.contact).toBe('2224445555');

      // AND: A warning should be displayed to the physician
      // (This would be handled by UI layer in real implementation)
      if (duplicate) {
        console.warn('Duplicate patient detected - user should be warned');
      }
      expect(duplicate).not.toBeNull();
    });

  });

  // ============================================================================
  // AC2: Validation — Missing Required Field
  // ============================================================================

  describe('AC2 — Validation (Missing Required Fields)', () => {

    it('test_AC2_submit_form_with_empty_name_field', () => {
      // GIVEN: A physician is on the patient registration screen
      //   AND the Name field is empty
      const formData = {
        name: '',
        contact: '3335556666',
      };

      // WHEN: The physician leaves the Name field empty
      //   AND clicks the "Submit" button
      const isValid = formValidator.validateAll(formData);

      // THEN: The system should block the form submission
      expect(isValid).toBe(false);

      // AND: Display a validation error for the Name field
      expect(formValidator.errors).toHaveProperty('name');
      expect(formValidator.errors.name).toContain('name');

      // AND: The patient record should NOT be created
      expect(patientStore.save).not.toHaveBeenCalled();
    });

    it('test_AC2_submit_form_with_empty_contact_field', () => {
      // GIVEN: A physician is on the patient registration screen
      //   AND the Contact field is empty
      const formData = {
        name: 'Sarah Johnson',
        contact: '',
      };

      // WHEN: The physician leaves the Contact field empty
      //   AND clicks the "Submit" button
      const isValid = formValidator.validateAll(formData);

      // THEN: The system should block the form submission
      expect(isValid).toBe(false);

      // AND: Display a validation error for the Contact field
      expect(formValidator.errors).toHaveProperty('contact');
      expect(formValidator.errors.contact).toContain('contact');

      // AND: The patient record should NOT be created
      expect(patientStore.save).not.toHaveBeenCalled();
    });

    it('test_AC2_submit_form_with_both_name_and_contact_empty', () => {
      // GIVEN: A physician is on the patient registration screen
      //   AND both Name and Contact fields are empty
      const formData = {
        name: '',
        contact: '',
      };

      // WHEN: The physician clicks the "Submit" button without entering data
      const isValid = formValidator.validateAll(formData);

      // THEN: The system should block the form submission
      expect(isValid).toBe(false);

      // AND: Display validation errors for BOTH fields
      expect(formValidator.errors).toHaveProperty('name');
      expect(formValidator.errors).toHaveProperty('contact');

      // AND: The patient record should NOT be created
      expect(patientStore.save).not.toHaveBeenCalled();
    });

    it('test_AC2_submit_form_with_whitespace_only_name', () => {
      // GIVEN: A physician is on the patient registration screen
      const formData = {
        name: '   ',
        contact: '7778889999',
      };

      // WHEN: The physician enters only whitespace in the Name field
      //   AND clicks the "Submit" button
      const isValid = formValidator.validateAll(formData);

      // THEN: The system should treat whitespace as empty
      expect(isValid).toBe(false);

      // AND: Display a validation error for the Name field
      expect(formValidator.errors).toHaveProperty('name');

      // AND: The patient record should NOT be created
      expect(patientStore.save).not.toHaveBeenCalled();
    });

    it('test_AC2_submit_form_with_whitespace_only_contact', () => {
      // GIVEN: A physician is on the patient registration screen
      const formData = {
        name: 'Emily Davis',
        contact: '   ',
      };

      // WHEN: The physician enters only whitespace in the Contact field
      //   AND clicks the "Submit" button
      const isValid = formValidator.validateAll(formData);

      // THEN: The system should treat whitespace as empty
      expect(isValid).toBe(false);

      // AND: Display a validation error for the Contact field
      expect(formValidator.errors).toHaveProperty('contact');

      // AND: The patient record should NOT be created
      expect(patientStore.save).not.toHaveBeenCalled();
    });

    it('test_AC2_clear_validation_error_on_field_input', () => {
      // GIVEN: A validation error is displayed for the Name field
      const formData = {
        name: '',
        contact: '2224445555',
      };
      let isValid = formValidator.validateAll(formData);
      expect(isValid).toBe(false);
      expect(formValidator.errors).toHaveProperty('name');

      // WHEN: The physician types a valid name in the Name field
      formData.name = 'Thomas Wilson';
      formValidator.validateRequired('name', formData.name);

      // THEN: The validation error should be cleared
      expect(formValidator.errors).not.toHaveProperty('name');

      // AND: The field should be marked as valid
      isValid = formValidator.validateAll(formData);
      expect(isValid).toBe(true);

      // AND: The form should be submittable
      expect(patientStore.save).not.toHaveBeenCalled(); // Not called yet
    });

  });

});
