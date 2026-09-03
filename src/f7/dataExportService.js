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

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdf(rows) {
  const reportLines = ["Visit Report", ""];

  rows.forEach((row, rowIndex) => {
    if (rowIndex > 0) {
      reportLines.push("");
    }
    reportLines.push(`Record ${rowIndex + 1}`);
    Object.entries(row).forEach(([key, value]) => {
      reportLines.push(`${key}: ${value}`);
    });
  });

  let y = 760;
  const content = reportLines
    .map((line) => {
      const text = escapePdfText(line);
      const block = `BT\n/F1 12 Tf\n50 ${y} Td\n(${text}) Tj\nET\n`;
      y -= 18;
      return block;
    })
    .join("");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    const offset = pdf.length;
    offsets.push(offset);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
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
    const content = buildPdf(rows);
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
