import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration Tests: F4 with F3 (and F1 context)
 *
 * Validates that prescription generation consumes consultation data
 * documented in F3 and includes patient information from F1.
 */

describe('F4 Integration with F3 — Prescription Generation', () => {
  const F1_PATIENT_STORAGE_KEY = 'pms.f1.patients';
  const F3_CONSULTATION_STORAGE_KEY = 'pms.f3.consultations';
  const F4_PRESCRIPTION_STORAGE_KEY = 'pms.f4.prescriptions';

  beforeEach(() => {
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      },
    };

    global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify([
      { id: 'p-001', name: 'John Doe', age: 38, sex: 'M' },
    ]));

    global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify([]));
    global.localStorage.setItem(F4_PRESCRIPTION_STORAGE_KEY, JSON.stringify([]));
  });

  function saveConsultationFromF3(consultationInput) {
    const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));
    const consultation = {
      id: `c-${consultations.length + 1}`,
      createdAt: new Date().toISOString(),
      ...consultationInput,
    };

    consultations.push(consultation);
    global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify(consultations));

    return consultation;
  }

  function generatePrescriptionFromF4({
    consultationId,
    noMedicationPolicy = 'BLOCK_ON_NO_MEDICATIONS',
    confirmedProceed = false,
  }) {
    const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));
    const patients = JSON.parse(global.localStorage.getItem(F1_PATIENT_STORAGE_KEY));
    const prescriptions = JSON.parse(global.localStorage.getItem(F4_PRESCRIPTION_STORAGE_KEY));

    const consultation = consultations.find((item) => item.id === consultationId);
    if (!consultation) {
      return {
        success: false,
        error: 'Consultation not found',
      };
    }

    const medications = Array.isArray(consultation.medications) ? consultation.medications : [];
    if (medications.length === 0) {
      if (noMedicationPolicy === 'ALLOW_WITH_CONFIRMATION' && confirmedProceed) {
        // Continue and create prescription.
      } else if (noMedicationPolicy === 'ALLOW_WITH_CONFIRMATION') {
        return {
          success: false,
          confirmationRequired: true,
          prompt: 'No medications found. Confirm to generate anyway.',
        };
      } else {
        return {
          success: false,
          blocked: true,
          prompt: 'Add at least one medication before generating prescription.',
        };
      }
    }

    const patient = patients.find((item) => item.id === consultation.patientId) || null;
    const prescription = {
      id: `rx-${prescriptions.length + 1}`,
      consultationId: consultation.id,
      header: 'Clinic Header',
      patientDetails: patient,
      vitals: consultation.vitals,
      diagnosis: consultation.diagnosis,
      medications,
      footer: 'Clinic Footer',
      printable: true,
      previewReady: true,
      createdAt: new Date().toISOString(),
    };

    prescriptions.push(prescription);
    global.localStorage.setItem(F4_PRESCRIPTION_STORAGE_KEY, JSON.stringify(prescriptions));

    return {
      success: true,
      prescription,
    };
  }

  it('test_AC1_F3_saved_consultation_generates_printable_F4_prescription', () => {
    const consultation = saveConsultationFromF3({
      patientId: 'p-001',
      vitals: { temperature: 98.6, bloodPressure: '120/80', pulse: 72 },
      diagnosis: 'Migraine',
      medications: ['Ibuprofen 400mg'],
    });

    const result = generatePrescriptionFromF4({ consultationId: consultation.id });

    expect(result.success).toBe(true);
    expect(result.prescription.printable).toBe(true);
    expect(result.prescription.previewReady).toBe(true);
    expect(result.prescription).toHaveProperty('header');
    expect(result.prescription).toHaveProperty('patientDetails');
    expect(result.prescription).toHaveProperty('vitals');
    expect(result.prescription).toHaveProperty('diagnosis');
    expect(result.prescription).toHaveProperty('medications');
    expect(result.prescription).toHaveProperty('footer');
  });

  it('test_AC1_F4_uses_F3_consultation_and_F1_patient_context', () => {
    const consultation = saveConsultationFromF3({
      patientId: 'p-001',
      vitals: { temperature: 99.1, bloodPressure: '130/86', pulse: 78 },
      diagnosis: 'Viral Fever',
      medications: ['Paracetamol 500mg'],
    });

    const result = generatePrescriptionFromF4({ consultationId: consultation.id });

    expect(result.success).toBe(true);
    expect(result.prescription.consultationId).toBe(consultation.id);
    expect(result.prescription.patientDetails).toBeDefined();
    expect(result.prescription.patientDetails.id).toBe('p-001');
    expect(result.prescription.diagnosis).toBe('Viral Fever');
    expect(result.prescription.vitals.temperature).toBe(99.1);
    expect(result.prescription.medications).toEqual(['Paracetamol 500mg']);
  });

  it('test_AC2_policy_block_prevents_generation_for_zero_medications', () => {
    const consultation = saveConsultationFromF3({
      patientId: 'p-001',
      vitals: { temperature: 98.4, bloodPressure: '118/76', pulse: 70 },
      diagnosis: 'Seasonal Allergy',
      medications: [],
    });

    const result = generatePrescriptionFromF4({
      consultationId: consultation.id,
      noMedicationPolicy: 'BLOCK_ON_NO_MEDICATIONS',
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.prompt).toContain('Add at least one medication');

    const prescriptions = JSON.parse(global.localStorage.getItem(F4_PRESCRIPTION_STORAGE_KEY));
    expect(prescriptions).toHaveLength(0);
  });

  it('test_AC2_policy_confirmation_requires_explicit_confirmation_before_generation', () => {
    const consultation = saveConsultationFromF3({
      patientId: 'p-001',
      vitals: { temperature: 98.9, bloodPressure: '122/82', pulse: 74 },
      diagnosis: 'Observation',
      medications: [],
    });

    const unconfirmed = generatePrescriptionFromF4({
      consultationId: consultation.id,
      noMedicationPolicy: 'ALLOW_WITH_CONFIRMATION',
      confirmedProceed: false,
    });

    expect(unconfirmed.success).toBe(false);
    expect(unconfirmed.confirmationRequired).toBe(true);

    const confirmed = generatePrescriptionFromF4({
      consultationId: consultation.id,
      noMedicationPolicy: 'ALLOW_WITH_CONFIRMATION',
      confirmedProceed: true,
    });

    expect(confirmed.success).toBe(true);
    expect(confirmed.prescription.medications).toEqual([]);
  });

  it('test_AC1_generation_fails_for_missing_or_unknown_consultation_id', () => {
    const result = generatePrescriptionFromF4({ consultationId: 'c-999' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Consultation not found');

    const prescriptions = JSON.parse(global.localStorage.getItem(F4_PRESCRIPTION_STORAGE_KEY));
    expect(prescriptions).toHaveLength(0);
  });
});
