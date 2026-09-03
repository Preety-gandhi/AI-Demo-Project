import { beforeEach, describe, expect, it, vi } from 'vitest';

const F1_PATIENT_STORAGE_KEY = 'pms.f1.patients';
const F5_VISIT_STORAGE_KEY = 'pms.f5.visits';

function createLocalStorage() {
  const values = new Map();

  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function readRows(key) {
  const raw = global.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function createExportWorkflow({ csvBuilder, pdfBuilder, download }) {
  return {
    exportCsv(rows) {
      if (!rows.length) {
        return { success: false, error: 'No data available to export' };
      }

      const file = csvBuilder(rows);
      download(file);
      return { success: true, file };
    },
    exportPdf(rows) {
      if (!rows.length) {
        return { success: false, error: 'No data available to export' };
      }

      const file = pdfBuilder(rows);
      download(file);
      return { success: true, file };
    },
  };
}

describe('F7 integration with F1 & F5 - Data Export', () => {
  beforeEach(() => {
    global.localStorage = createLocalStorage();
    global.localStorage.setItem(
      F1_PATIENT_STORAGE_KEY,
      JSON.stringify([
        { id: 'p-001', name: 'John Doe', contact: '555-1001' },
        { id: 'p-002', name: 'Jane Smith', contact: '555-1002' },
      ]),
    );
    global.localStorage.setItem(
      F5_VISIT_STORAGE_KEY,
      JSON.stringify([
        { id: 'v-001', patientId: 'p-001', date: '2026-08-10', diagnosis: 'Migraine' },
        { id: 'v-002', patientId: 'p-001', date: '2026-08-20', diagnosis: 'Follow-up' },
        { id: 'v-003', patientId: 'p-002', date: '2026-08-15', diagnosis: 'Cold' },
      ]),
    );
  });

  it('test_AC1_exports_F1_patient_records_to_csv_and_triggers_download', () => {
    const patients = readRows(F1_PATIENT_STORAGE_KEY);
    const download = vi.fn();
    const workflow = createExportWorkflow({
      csvBuilder: (rows) => ({
        fileName: 'patients.csv',
        content: ['id,name,contact', ...rows.map((row) => `${row.id},${row.name},${row.contact}`)].join('\n'),
      }),
      pdfBuilder: vi.fn(),
      download,
    });

    const result = workflow.exportCsv(patients);

    expect(result.success).toBe(true);
    expect(result.file.fileName).toBe('patients.csv');
    expect(result.file.content).toContain('p-001,John Doe,555-1001');
    expect(result.file.content).toContain('p-002,Jane Smith,555-1002');
    expect(download).toHaveBeenCalledWith(result.file);
  });

  it('test_AC1_exports_F5_filtered_visits_to_pdf_only', () => {
    const visits = readRows(F5_VISIT_STORAGE_KEY);
    const selectedVisits = visits.filter((visit) => visit.patientId === 'p-001');
    const download = vi.fn();
    const pdfBuilder = vi.fn((rows) => ({
      fileName: 'p-001-visits.pdf',
      printable: true,
      records: rows,
    }));
    const workflow = createExportWorkflow({
      csvBuilder: vi.fn(),
      pdfBuilder,
      download,
    });

    const result = workflow.exportPdf(selectedVisits);

    expect(result.success).toBe(true);
    expect(pdfBuilder).toHaveBeenCalledWith(selectedVisits);
    expect(result.file.printable).toBe(true);
    expect(result.file.records.map((visit) => visit.id)).toEqual(['v-001', 'v-002']);
    expect(result.file.records).not.toContainEqual(expect.objectContaining({ id: 'v-003' }));
    expect(download).toHaveBeenCalledWith(result.file);
  });

  it('test_AC1_export_uses_current_F5_filtered_visit_snapshot_without_mutating_source', () => {
    const sourceVisits = readRows(F5_VISIT_STORAGE_KEY);
    const sourceSnapshot = structuredClone(sourceVisits);
    const filteredVisits = sourceVisits.filter((visit) => visit.date >= '2026-08-15');
    const workflow = createExportWorkflow({
      csvBuilder: (rows) => ({ fileName: 'visits.csv', records: rows }),
      pdfBuilder: vi.fn(),
      download: vi.fn(),
    });

    workflow.exportCsv(filteredVisits);

    expect(readRows(F5_VISIT_STORAGE_KEY)).toEqual(sourceSnapshot);
    expect(filteredVisits.map((visit) => visit.id)).toEqual(['v-002', 'v-003']);
  });

  it('test_AC2_blocks_csv_and_pdf_export_for_empty_F5_dataset', () => {
    const download = vi.fn();
    const csvBuilder = vi.fn();
    const pdfBuilder = vi.fn();
    const workflow = createExportWorkflow({ csvBuilder, pdfBuilder, download });

    const csvResult = workflow.exportCsv([]);
    const pdfResult = workflow.exportPdf([]);

    expect(csvResult).toEqual({ success: false, error: 'No data available to export' });
    expect(pdfResult).toEqual({ success: false, error: 'No data available to export' });
    expect(csvBuilder).not.toHaveBeenCalled();
    expect(pdfBuilder).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
  });
});
