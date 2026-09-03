const F1_PATIENT_STORAGE_KEY = "pms.f1.patients";
const F3_CONSULTATION_STORAGE_KEY = "pms.f3.consultations";

function readPatients() {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(F1_PATIENT_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function escapeCsvValue(value) {
  const text = value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function readJsonArray(storageKey) {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readExportDatasets() {
  return {
    patients: readJsonArray(F1_PATIENT_STORAGE_KEY),
    visits: readJsonArray(F3_CONSULTATION_STORAGE_KEY),
  };
}

function buildCsv(rows) {
  const headers = Object.keys(rows[0]);
  return [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
}

function flattenVisitRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    patientId: row.patientId,
    temperature: row.vitals?.temperature ?? "",
    bloodPressure: row.vitals?.bloodPressure ?? "",
    pulse: row.vitals?.pulse ?? "",
    complaints: row.complaints ?? "",
    diagnosis: row.diagnosis ?? "",
    medications: Array.isArray(row.medications) ? row.medications.join("; ") : row.medications ?? "",
    createdAt: row.createdAt ?? "",
  }));
}

export function exportData(rows, format, datasetName) {
  if (!rows.length) {
    return { success: false, error: "No data available to export" };
  }

  if (format === "csv") {
    const exportRows = datasetName === "visits" ? flattenVisitRows(rows) : rows;
    return {
      success: true,
      fileName: `${datasetName}.csv`,
      mimeType: "text/csv",
      content: buildCsv(exportRows),
    };
  }

  if (format === "pdf") {
    const content = rows
      .map((row) => Object.entries(row).map(([key, value]) => `${key}: ${value}`).join("\n"))
      .join("\n\n");
    return {
      success: true,
      fileName: `${datasetName}.pdf`,
      mimeType: "application/pdf",
      content,
      printable: true,
    };
  }

  return { success: false, error: "Unsupported export format" };
}

export function exportPatientData(format) {
  const patients = readPatients();

  if (format !== "csv") {
    return { success: false, error: "Unsupported export format" };
  }

  if (!patients.length) {
    return { success: false, error: "No data available to export" };
  }

  const headers = ["id", "name", "contact"];
  const rows = patients.map((patient) => [patient.id, patient.name, patient.contact]);
  const content = [
    headers,
    ...rows,
  ].map((row) => row.map(escapeCsvValue).join(",")).join("\n");

  return {
    success: true,
    fileName: "patients.csv",
    content,
  };
}
