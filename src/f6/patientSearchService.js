const F1_PATIENT_STORAGE_KEY = "pms.f1.patients";

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

function readPatients() {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  const raw = window.localStorage.getItem(F1_PATIENT_STORAGE_KEY);
  return safeJsonArray(raw).filter((patient) => patient && patient.id !== undefined);
}

// AC1: match by name (case-insensitive substring) or contact (substring), rank exact match then recent activity.
export function searchPatients(query) {
  const trimmedQuery = String(query ?? "").trim();
  const lowerQuery = trimmedQuery.toLowerCase();

  const matches = readPatients()
    .filter((patient) => {
      const name = String(patient.name ?? "").toLowerCase();
      const contact = String(patient.contact ?? "");
      return trimmedQuery.length > 0 && (name.includes(lowerQuery) || contact.includes(trimmedQuery));
    })
    .sort((a, b) => {
      const aExact = String(a.name ?? "").toLowerCase() === lowerQuery || String(a.contact ?? "") === trimmedQuery;
      const bExact = String(b.name ?? "").toLowerCase() === lowerQuery || String(b.contact ?? "") === trimmedQuery;
      if (aExact !== bExact) {
        return aExact ? -1 : 1;
      }
      return String(b.lastActivity ?? "").localeCompare(String(a.lastActivity ?? ""));
    })
    .map((patient) => ({
      id: String(patient.id),
      name: patient.name,
      contact: patient.contact,
      lastActivity: patient.lastActivity,
      profileUrl: `../f1/index.html?patientId=${patient.id}`,
      historyUrl: `../f5/index.html?patientId=${patient.id}`,
    }));

  if (matches.length === 0) {
    return {
      success: true,
      patients: [],
      message: "No results found. Create a new patient.",
      createPatientUrl: "../f1/index.html",
    };
  }

  return { success: true, patients: matches };
}
