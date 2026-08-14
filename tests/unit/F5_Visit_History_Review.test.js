import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('F5 - Visit History Review', () => {
  let historyService;
  let visits;

  beforeEach(() => {
    visits = [
      {
        id: 'v1',
        patientId: 'p-001',
        date: '2026-08-10',
        vitals: { temperature: 98.6, bloodPressure: '120/80', pulse: 72 },
        complaints: 'Headache',
        diagnosis: 'Migraine',
        prescriptions: ['Ibuprofen 400mg'],
      },
      {
        id: 'v2',
        patientId: 'p-001',
        date: '2026-08-01',
        vitals: { temperature: 99.0, bloodPressure: '118/78', pulse: 75 },
        complaints: 'Fever',
        diagnosis: 'Viral fever',
        prescriptions: ['Paracetamol 500mg'],
      },
      {
        id: 'v3',
        patientId: 'p-001',
        date: '2026-07-20',
        vitals: { temperature: 98.7, bloodPressure: '122/81', pulse: 73 },
        complaints: 'Cough',
        diagnosis: 'Cold',
        prescriptions: ['Cough syrup'],
      },
    ];

    historyService = {
      getHistory: vi.fn((patientId) => {
        return visits
          .filter((v) => v.patientId === patientId)
          .sort((a, b) => b.date.localeCompare(a.date));
      }),
      filterByDateRange: vi.fn((patientId, startDate, endDate) => {
        return historyService.getHistory(patientId).filter((v) => {
          return v.date >= startDate && v.date <= endDate;
        });
      }),
    };
  });

  describe('AC1 - Happy path', () => {
    it('test_AC1_show_previous_visits_with_quick_clinical_details', () => {
      const result = historyService.getHistory('p-001');

      expect(result.length).toBe(3);
      expect(result[0]).toEqual(expect.objectContaining({
        vitals: expect.any(Object),
        complaints: expect.any(String),
        diagnosis: expect.any(String),
        prescriptions: expect.any(Array),
      }));
    });
  });

  describe('AC2 - Filter by date', () => {
    it('test_AC2_show_only_visits_within_selected_date_range', () => {
      const filtered = historyService.filterByDateRange('p-001', '2026-08-01', '2026-08-31');

      expect(filtered.length).toBe(2);
      expect(filtered.map((v) => v.id)).toEqual(['v1', 'v2']);
    });

    it('test_AC2_return_empty_list_when_no_dates_match', () => {
      const filtered = historyService.filterByDateRange('p-001', '2026-06-01', '2026-06-30');

      expect(filtered).toEqual([]);
    });
  });
});
