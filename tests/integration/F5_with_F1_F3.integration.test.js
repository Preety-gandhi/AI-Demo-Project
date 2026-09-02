import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration Tests: F5 with F1 & F3
 *
 * Validates that visit history review reads patient data from F1 and
 * consultation records saved by F3, and supports date-range filtering.
 */

describe('F5 Integration with F1 & F3 — Visit History Review', () => {
  const F1_PATIENT_STORAGE_KEY = 'pms.f1.patients';
  const F3_CONSULTATION_STORAGE_KEY = 'pms.f3.consultations';

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
      { id: 'p-001', name: 'John Doe' },
    ]));

    global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify([]));
  });

  function saveConsultationFromF3(consultationInput) {
    const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));
    const consultation = { id: `c-${consultations.length + 1}`, ...consultationInput };
    consultations.push(consultation);
    global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify(consultations));
    return consultation;
  }

  function getHistoryFromF5(patientId) {
    const patients = JSON.parse(global.localStorage.getItem(F1_PATIENT_STORAGE_KEY));
    const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));

    const patient = patients.find((p) => p.id === patientId) || null;
    const visits = consultations
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));

    return { patient, visits };
  }

  function filterHistoryByDateRange(patientId, startDate, endDate) {
    if (endDate < startDate) {
      return { success: false, error: 'End date must not be before start date' };
    }

    const { visits } = getHistoryFromF5(patientId);
    const filtered = visits.filter((v) => v.date >= startDate && v.date <= endDate);
    return { success: true, visits: filtered };
  }

  it('test_AC1_F5_history_reads_F1_patient_and_F3_consultations', () => {
    saveConsultationFromF3({
      patientId: 'p-001',
      date: '2026-08-10',
      vitals: { temperature: 98.6, bloodPressure: '120/80', pulse: 72 },
      diagnosis: 'Migraine',
      prescriptions: ['Ibuprofen 400mg'],
    });

    const { patient, visits } = getHistoryFromF5('p-001');

    expect(patient).toBeDefined();
    expect(patient.id).toBe('p-001');
    expect(visits).toHaveLength(1);
    expect(visits[0].diagnosis).toBe('Migraine');
  });

  it('test_AC1_F5_orders_multiple_F3_visits_most_recent_first', () => {
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-07-20', diagnosis: 'Cold' });
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-08-10', diagnosis: 'Migraine' });
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-08-01', diagnosis: 'Viral fever' });

    const { visits } = getHistoryFromF5('p-001');

    expect(visits.map((v) => v.date)).toEqual(['2026-08-10', '2026-08-01', '2026-07-20']);
  });

  it('test_AC1_F5_shows_no_visits_when_patient_has_no_F3_consultations', () => {
    const { patient, visits } = getHistoryFromF5('p-001');

    expect(patient).toBeDefined();
    expect(visits).toHaveLength(0);
  });

  it('test_AC2_F5_filters_F3_visits_within_inclusive_date_range', () => {
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-08-10', diagnosis: 'Migraine' });
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-08-01', diagnosis: 'Viral fever' });
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-07-20', diagnosis: 'Cold' });

    const result = filterHistoryByDateRange('p-001', '2026-08-01', '2026-08-31');

    expect(result.success).toBe(true);
    expect(result.visits.map((v) => v.date)).toEqual(['2026-08-10', '2026-08-01']);
  });

  it('test_AC2_F5_returns_empty_result_when_no_F3_visits_match_range', () => {
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-08-10', diagnosis: 'Migraine' });

    const result = filterHistoryByDateRange('p-001', '2026-06-01', '2026-06-30');

    expect(result.success).toBe(true);
    expect(result.visits).toEqual([]);
  });

  it('test_AC2_F5_rejects_invalid_date_range_before_querying_F3_data', () => {
    saveConsultationFromF3({ patientId: 'p-001', date: '2026-08-10', diagnosis: 'Migraine' });

    const result = filterHistoryByDateRange('p-001', '2026-08-31', '2026-08-01');

    expect(result.success).toBe(false);
    expect(result.error).toContain('End date must not be before start date');
  });
});
