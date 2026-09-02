const F1_PATIENT_STORAGE_KEY = "pms.f1.patients";
const F3_CONSULTATION_STORAGE_KEY = "pms.f3.consultations";

function safeJsonArray(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readConsultations() {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  const raw = window.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY);
  return safeJsonArray(raw).filter((item) => item && typeof item.id === "string");
}

export function readPatients() {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  const raw = window.localStorage.getItem(F1_PATIENT_STORAGE_KEY);
  return safeJsonArray(raw)
    .filter((patient) => patient && patient.id !== undefined)
    .map((patient) => ({ id: String(patient.id), name: String(patient.name ?? "").trim() || "Unnamed Patient" }));
}

// AC1: history view needs vitals/complaints/diagnosis/prescriptions per visit, most recent first.
export function getPatientHistory(patientId) {
  return readConsultations()
    .filter((item) => item.patientId === patientId)
    .map((item) => ({
      id: item.id,
      patientId: item.patientId,
      createdAt: item.createdAt,
      vitals: item.vitals || {},
      complaints: item.complaints || "",
      diagnosis: item.diagnosis || "",
      prescriptions: Array.isArray(item.medications) ? item.medications : [],
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

// AC2: filter visits to those with createdAt date within the inclusive [startDate, endDate] range.
export function filterHistoryByDateRange(patientId, startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) {
    return { success: false, error: "End date must not be before start date", visits: [] };
  }

  const visits = getPatientHistory(patientId).filter((visit) => {
    const visitDate = String(visit.createdAt).slice(0, 10);
    return visitDate >= startDate && visitDate <= endDate;
  });

  return { success: true, visits };
}
