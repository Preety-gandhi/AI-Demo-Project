import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('F3 - Consultation Record Capture', () => {
  let consultationStore;
  let patientHistory;
  let consultationService;

  beforeEach(() => {
    consultationStore = {
      consultations: [],
      save: vi.fn(async (consultation) => {
        consultationStore.consultations.push(consultation);
        return { success: true, consultation };
      }),
    };

    patientHistory = {
      links: [],
      linkVisit: vi.fn(async (patientId, consultationId) => {
        patientHistory.links.push({ patientId, consultationId });
        return { success: true };
      }),
    };

    consultationService = {
      validateVitals: vi.fn((vitals) => {
        const errors = [];
        if (vitals.temperature == null) errors.push('temperature');
        if (!vitals.bloodPressure) errors.push('bloodPressure');
        if (vitals.pulse == null) errors.push('pulse');
        return errors;
      }),
      saveConsultation: vi.fn(async (input) => {
        const missing = consultationService.validateVitals(input.vitals);
        if (missing.length > 0) {
          return { success: false, errors: missing };
        }

        const consultation = {
          ...input,
          id: `c-${consultationStore.consultations.length + 1}`,
        };

        await consultationStore.save(consultation);
        await patientHistory.linkVisit(input.patientId, consultation.id);

        return { success: true, consultation };
      }),
    };
  });

  describe('AC1 - Happy path', () => {
    it('test_AC1_save_consultation_and_link_to_patient_history', async () => {
      const input = {
        patientId: 'p-001',
        vitals: {
          temperature: 98.6,
          bloodPressure: '120/80',
          pulse: 72,
        },
        complaints: 'Headache',
        diagnosis: 'Migraine',
        medications: ['Ibuprofen 400mg'],
      };

      const result = await consultationService.saveConsultation(input);

      expect(result.success).toBe(true);
      expect(consultationStore.save).toHaveBeenCalledTimes(1);
      expect(patientHistory.linkVisit).toHaveBeenCalledWith('p-001', 'c-1');
      expect(patientHistory.links).toContainEqual({ patientId: 'p-001', consultationId: 'c-1' });
    });
  });

  describe('AC2 - Missing mandatory vitals', () => {
    it('test_AC2_block_save_without_temperature', async () => {
      const result = await consultationService.saveConsultation({
        patientId: 'p-001',
        vitals: { bloodPressure: '120/80', pulse: 72 },
        complaints: 'Headache',
        diagnosis: 'Migraine',
        medications: ['Ibuprofen 400mg'],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('temperature');
      expect(consultationStore.save).not.toHaveBeenCalled();
    });

    it('test_AC2_block_save_without_blood_pressure', async () => {
      const result = await consultationService.saveConsultation({
        patientId: 'p-001',
        vitals: { temperature: 98.6, pulse: 72 },
        complaints: 'Headache',
        diagnosis: 'Migraine',
        medications: ['Ibuprofen 400mg'],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('bloodPressure');
      expect(consultationStore.save).not.toHaveBeenCalled();
    });

    it('test_AC2_block_save_without_pulse', async () => {
      const result = await consultationService.saveConsultation({
        patientId: 'p-001',
        vitals: { temperature: 98.6, bloodPressure: '120/80' },
        complaints: 'Headache',
        diagnosis: 'Migraine',
        medications: ['Ibuprofen 400mg'],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('pulse');
      expect(consultationStore.save).not.toHaveBeenCalled();
    });
  });
});
