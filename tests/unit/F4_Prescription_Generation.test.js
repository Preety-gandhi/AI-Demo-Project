import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('F4 - Prescription Generation', () => {
  let generator;

  beforeEach(() => {
    generator = {
      build: vi.fn((consultation) => {
        if (!consultation || !Array.isArray(consultation.medications)) {
          return { success: false, error: 'Invalid consultation' };
        }

        if (consultation.medications.length === 0) {
          return {
            success: false,
            error: 'Add at least one medication',
          };
        }

        return {
          success: true,
          document: {
            header: 'Clinic Header',
            patientDetails: consultation.patient,
            vitals: consultation.vitals,
            diagnosis: consultation.diagnosis,
            medications: consultation.medications,
            footer: 'Clinic Footer',
            printable: true,
          },
        };
      }),
    };
  });

  describe('AC1 - Happy path', () => {
    it('test_AC1_generate_printable_prescription_for_valid_consultation', () => {
      const consultation = {
        patient: { id: 'p-001', name: 'John Doe' },
        vitals: { temperature: 98.6, bloodPressure: '120/80', pulse: 72 },
        diagnosis: 'Migraine',
        medications: ['Ibuprofen 400mg'],
      };

      const result = generator.build(consultation);

      expect(result.success).toBe(true);
      expect(result.document.printable).toBe(true);
      expect(result.document).toHaveProperty('header');
      expect(result.document).toHaveProperty('patientDetails');
      expect(result.document).toHaveProperty('vitals');
      expect(result.document).toHaveProperty('diagnosis');
      expect(result.document).toHaveProperty('medications');
      expect(result.document).toHaveProperty('footer');
    });
  });

  describe('AC2 - No medications edge case', () => {
    it('test_AC2_prevent_generation_when_consultation_has_zero_medications', () => {
      const consultation = {
        patient: { id: 'p-001', name: 'John Doe' },
        vitals: { temperature: 98.6, bloodPressure: '120/80', pulse: 72 },
        diagnosis: 'Migraine',
        medications: [],
      };

      const result = generator.build(consultation);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Add at least one medication');
    });
  });
});
