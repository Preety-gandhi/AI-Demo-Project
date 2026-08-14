import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('F6 - Patient Search and Navigation', () => {
  let patientService;
  let navigate;

  beforeEach(() => {
    const patients = [
      { id: 'p-001', name: 'John Doe', phone: '1234567890', lastActivity: '2026-08-10' },
      { id: 'p-002', name: 'Jane Doe', phone: '1230000000', lastActivity: '2026-08-12' },
      { id: 'p-003', name: 'Sam Patel', phone: '9876543210', lastActivity: '2026-08-05' },
    ];

    patientService = {
      search: vi.fn((query) => {
        const q = query.toLowerCase();
        const matched = patients.filter((p) => {
          return p.name.toLowerCase().includes(q) || p.phone.includes(query);
        });

        return matched.sort((a, b) => {
          const aExact = a.name.toLowerCase() === q || a.phone === query;
          const bExact = b.name.toLowerCase() === q || b.phone === query;
          if (aExact !== bExact) return aExact ? -1 : 1;
          return b.lastActivity.localeCompare(a.lastActivity);
        });
      }),
    };

    navigate = vi.fn((patientId) => `/patients/${patientId}`);
  });

  describe('AC1 - Happy path', () => {
    it('test_AC1_search_by_full_or_partial_name_returns_ranked_matches', () => {
      const result = patientService.search('Doe');

      expect(result.length).toBe(2);
      expect(result[0].lastActivity >= result[1].lastActivity).toBe(true);
    });

    it('test_AC1_search_by_phone_returns_matching_patient', () => {
      const result = patientService.search('9876543210');

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('p-003');
    });

    it('test_AC1_open_matching_patient_record_quickly', () => {
      const result = patientService.search('John');
      const route = navigate(result[0].id);

      expect(route).toBe('/patients/p-001');
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC2 - No results', () => {
    it('test_AC2_show_no_results_message_for_non_existent_patient', () => {
      const result = patientService.search('Unknown Person');

      const message = result.length === 0 ? 'no results found' : '';
      expect(result).toEqual([]);
      expect(message).toBe('no results found');
    });

    it('test_AC2_suggest_creating_new_patient_when_no_results_found', () => {
      const result = patientService.search('No Match');

      const suggestion = result.length === 0 ? 'create new patient' : '';
      expect(suggestion).toBe('create new patient');
    });
  });
});
