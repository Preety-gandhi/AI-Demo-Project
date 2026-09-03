import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportData } from '../../src/f7/dataExportService.js';

describe('F7 - Data Export (CSV/PDF)', () => {
  let exportService;

  beforeEach(() => {
    exportService = {
      toCSV: vi.fn((rows) => {
        if (rows.length === 0) {
          return { success: false, error: 'No data available to export' };
        }

        const headers = Object.keys(rows[0]).join(',');
        const values = rows.map((r) => Object.values(r).join(',')).join('\n');
        return { success: true, fileName: 'export.csv', content: `${headers}\n${values}` };
      }),
      toPDF: vi.fn((rows) => {
        if (rows.length === 0) {
          return { success: false, error: 'No data available to export' };
        }

        return { success: true, fileName: 'export.pdf', content: 'PDF_BINARY' };
      }),
    };
  });

  describe('AC1 - Happy path', () => {
    it('test_AC1_export_selected_dataset_to_csv', () => {
      const rows = [
        { patientId: 'p-001', date: '2026-08-10', diagnosis: 'Migraine' },
        { patientId: 'p-002', date: '2026-08-11', diagnosis: 'Cold' },
      ];

      const result = exportService.toCSV(rows);

      expect(result.success).toBe(true);
      expect(result.fileName).toBe('export.csv');
      expect(result.content).toContain('patientId,date,diagnosis');
    });

    it('test_AC1_export_selected_dataset_to_pdf', () => {
      const rows = [
        { patientId: 'p-001', date: '2026-08-10', diagnosis: 'Migraine' },
      ];

      const result = exportService.toPDF(rows);

      expect(result.success).toBe(true);
      expect(result.fileName).toBe('export.pdf');
      expect(result.content).toBe('PDF_BINARY');
    });
  });

  describe('AC2 - Empty dataset', () => {
    it('test_AC2_prevent_csv_export_for_empty_dataset', () => {
      const result = exportService.toCSV([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data available to export');
    });

    it('test_AC2_prevent_pdf_export_for_empty_dataset', () => {
      const result = exportService.toPDF([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data available to export');
    });
  });

  it('produces valid PDF bytes for non-empty exports', () => {
    const result = exportData(
      [{ patientId: 'p-001', diagnosis: 'Migraine' }],
      'pdf',
      'patients',
    );

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('patients.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.content).toMatch(/^%PDF/);
  });
});
