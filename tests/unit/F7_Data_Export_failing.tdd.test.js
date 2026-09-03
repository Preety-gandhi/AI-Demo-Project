import { beforeEach, describe, expect, it } from 'vitest';
import { exportPatientData } from '../../src/f7/dataExportService.js';

const F1_PATIENT_STORAGE_KEY = 'pms.f1.patients';

describe('F7 - Data Export (TDD)', () => {
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
      { id: 'p-001', name: 'John Doe', contact: '555-1001' },
    ]));
  });

  it('test_AC1_export_patient_data_to_csv_returns_downloadable_file', () => {
    const result = exportPatientData('csv');

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('patients.csv');
    expect(result.content).toContain('id,name,contact');
    expect(result.content).toContain('p-001,John Doe,555-1001');
  });
});
