import { describe, it, expect, beforeEach } from 'vitest';
import { getPatientHistory } from '../../src/f5/visitHistoryService.js';

const F1_PATIENT_STORAGE_KEY = 'pms.f1.patients';
const F3_CONSULTATION_STORAGE_KEY = 'pms.f3.consultations';

describe('F5 - Visit History Review (TDD)', () => {
  beforeEach(() => {
    global.window = global;
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    };

    global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify([
      { id: 'p-001', name: 'John Doe' },
    ]));

    global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify([
      {
        id: 'c-1',
        patientId: 'p-001',
        createdAt: '2026-08-10T09:00:00.000Z',
        vitals: { temperature: '98.6', bloodPressure: '120/80', pulse: '72' },
        complaints: 'Headache',
        diagnosis: 'Migraine',
        medications: ['Ibuprofen 400mg'],
      },
    ]));
  });

  it('test_AC1_getPatientHistory_returns_visits_with_quick_clinical_details', () => {
    const visits = getPatientHistory('p-001');

    expect(visits).toHaveLength(1);
    expect(visits[0]).toEqual(
      expect.objectContaining({
        id: 'c-1',
        vitals: expect.any(Object),
        complaints: 'Headache',
        diagnosis: 'Migraine',
        prescriptions: ['Ibuprofen 400mg'],
      }),
    );
  });
});
