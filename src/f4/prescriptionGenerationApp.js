function structuredLog(event, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    feature: "F4",
    event,
    timestamp,
    ...details,
  };
  console.info(JSON.stringify(logEntry));
}

const F1_PATIENT_STORAGE_KEY = "pms.f1.patients";
const F3_CONSULTATION_STORAGE_KEY = "pms.f3.consultations";

function normalizeText(value) {
  return String(value ?? "").trim();
}

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

function safeSlug(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function readPatients() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const raw = window.localStorage.getItem(F1_PATIENT_STORAGE_KEY);
    return safeJsonArray(raw)
      .filter((patient) => patient && patient.id !== undefined)
      .map((patient) => ({
        id: String(patient.id),
        name: normalizeText(patient.name) || "Unnamed Patient",
      }));
  } catch {
    return [];
  }
}

function readConsultations() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const raw = window.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY);
    return safeJsonArray(raw)
      .filter((item) => item && typeof item.id === "string")
      .map((item) => ({
        id: item.id,
        patientId: normalizeText(item.patientId),
        vitals: {
          temperature: normalizeText(item.vitals?.temperature),
          bloodPressure: normalizeText(item.vitals?.bloodPressure),
          pulse: normalizeText(item.vitals?.pulse),
        },
        diagnosis: normalizeText(item.diagnosis),
        medications: Array.isArray(item.medications)
          ? item.medications.map(normalizeText).filter(Boolean)
          : [],
        createdAt: normalizeText(item.createdAt) || new Date().toISOString(),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function buildPrescriptionFilename(patientName, createdAt) {
  const isoDate = normalizeText(createdAt).slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `prescription_${safeSlug(patientName)}_${isoDate}.txt`;
}

function buildLayout() {
  return `
    <section class="panel">
      <h1>Prescription Generation</h1>
      <p class="subtitle">Generate a printable prescription from a saved consultation.</p>

      <div id="status-message" class="status-message" aria-live="polite"></div>

      <form id="prescription-form" novalidate>
        <div class="field-row">
          <label for="patientId">Patient *</label>
          <select id="patientId" name="patientId">
            <option value="">Select patient</option>
          </select>
        </div>

        <div class="field-row">
          <label for="consultationId">Consultation *</label>
          <select id="consultationId" name="consultationId" disabled>
            <option value="">Select consultation</option>
          </select>
        </div>

        <div class="actions">
          <button id="generate-btn" type="submit">Generate Prescription</button>
          <button id="clear-btn" type="button" class="btn-secondary">Clear</button>
        </div>
      </form>

      <p id="recovery-message" class="recovery-message" aria-live="polite"></p>
    </section>

    <section class="panel">
      <h2>Print Preview</h2>
      <p class="subtitle">Review all details before printing.</p>

      <div id="prescription-preview">
        <p class="preview-empty">No prescription generated yet.</p>
      </div>

      <div class="actions">
        <button id="print-btn" type="button" disabled>Print</button>
      </div>
    </section>
  `;
}

function renderConsultationOptions(consultationSelect, consultations) {
  const options = consultations
    .map(
      (item) => `<option value="${item.id}">${formatDateTime(item.createdAt)} | ${item.id}</option>`,
    )
    .join("");

  consultationSelect.innerHTML = `<option value="">Select consultation</option>${options}`;
  consultationSelect.disabled = consultations.length === 0;
}

function renderPrescription(document) {
  const medicationsHtml = document.medications
    .map((medication) => `<li>${medication}</li>`)
    .join("");

  return `
    <article class="prescription-sheet" data-filename="${document.filename}">
      <header class="prescription-head">
        <h3>${document.header.clinicName}</h3>
        <p>${document.header.clinicAddress}</p>
        <p>${document.header.clinicPhone}</p>
      </header>

      <section class="prescription-section">
        <div class="prescription-grid">
          <p><strong>Patient:</strong> ${document.patientDetails.name}</p>
          <p><strong>Patient ID:</strong> ${document.patientDetails.id}</p>
          <p><strong>Consultation:</strong> ${document.consultationId}</p>
          <p><strong>Date:</strong> ${formatDateTime(document.generatedAt)}</p>
        </div>
      </section>

      <section class="prescription-section">
        <p><strong>Vitals:</strong> Temp ${document.vitals.temperature || "-"}, BP ${document.vitals.bloodPressure || "-"}, Pulse ${document.vitals.pulse || "-"}</p>
        <p><strong>Diagnosis:</strong> ${document.diagnosis || "-"}</p>
      </section>

      <section class="prescription-section">
        <p><strong>Medications:</strong></p>
        <ul class="medication-list">${medicationsHtml}</ul>
      </section>

      <footer class="prescription-foot">
        <p>${document.footer}</p>
        <p><strong>Export Filename:</strong> ${document.filename}</p>
      </footer>
    </article>
  `;
}

function buildPrescriptionDocument(consultation, patient) {
  return {
    header: {
      clinicName: "CityCare Clinic",
      clinicAddress: "21 Wellness Avenue",
      clinicPhone: "Phone: +1 (555) 010-4021",
    },
    patientDetails: {
      id: patient.id,
      name: patient.name,
    },
    consultationId: consultation.id,
    generatedAt: new Date().toISOString(),
    vitals: consultation.vitals,
    diagnosis: consultation.diagnosis,
    medications: consultation.medications,
    footer: "Prescribing Physician Signature: ____________________",
    filename: buildPrescriptionFilename(patient.name, consultation.createdAt),
    printable: true,
  };
}

export function createPrescriptionGenerationApp({ mount } = {}) {
  if (!mount) {
    throw new Error("Mount container is required");
  }

  const patientsFromStorage = readPatients();
  const patients = patientsFromStorage;
  const consultations = readConsultations();
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

  structuredLog("ui_init_enter", {
    patientCount: patients.length,
    consultationCount: consultations.length,
  });

  mount.innerHTML = buildLayout();

  const form = mount.querySelector("#prescription-form");
  const patientSelect = mount.querySelector("#patientId");
  const consultationSelect = mount.querySelector("#consultationId");
  const clearBtn = mount.querySelector("#clear-btn");
  const printBtn = mount.querySelector("#print-btn");
  const statusMessage = mount.querySelector("#status-message");
  const preview = mount.querySelector("#prescription-preview");
  const recoveryMessage = mount.querySelector("#recovery-message");

  const patientOptions = patients
    .map((patient) => `<option value="${patient.id}">${patient.name}</option>`)
    .join("");
  patientSelect.insertAdjacentHTML("beforeend", patientOptions);

  if (!patients.length) {
    patientSelect.disabled = true;
    consultationSelect.disabled = true;
    setRecoveryMessage("No registered patients found. Register patients in F1 before generating prescriptions.");
  }

  function showStatus(message, type = "success") {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.className = "status-message";
    statusMessage.textContent = "";
  }

  function setRecoveryMessage(message = "") {
    recoveryMessage.textContent = message;
  }

  function getConsultationsByPatient(patientId) {
    return consultations.filter((item) => item.patientId === patientId);
  }

  function resetPreview() {
    preview.innerHTML = `<p class="preview-empty">No prescription generated yet.</p>`;
    printBtn.disabled = true;
  }

  function onPatientChange() {
    const patientId = normalizeText(patientSelect.value);
    const patientConsultations = patientId ? getConsultationsByPatient(patientId) : [];
    renderConsultationOptions(consultationSelect, patientConsultations);
    setRecoveryMessage(
      patientId && !patientConsultations.length
        ? "No consultations found for this patient. Capture one in F3 before generating a prescription."
        : "",
    );
    clearStatus();
    resetPreview();

    structuredLog("patient_change", {
      patientId,
      consultationCount: patientConsultations.length,
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearStatus();
    setRecoveryMessage("");

    const patientId = normalizeText(patientSelect.value);
    const consultationId = normalizeText(consultationSelect.value);

    if (!patientId) {
      showStatus("Select a patient before generating a prescription.", "error");
      structuredLog("generation_blocked", {
        reason: "missing_patient",
      });
      return;
    }

    if (!consultationId) {
      showStatus("Select a consultation before generating a prescription.", "error");
      structuredLog("generation_blocked", {
        reason: "missing_consultation",
        patientId,
      });
      return;
    }

    const patient = patientMap.get(patientId) ?? { id: patientId, name: patientId };
    const consultation = consultations.find((item) => item.id === consultationId && item.patientId === patientId);

    if (!consultation) {
      showStatus("Selected consultation is not available for this patient.", "error");
      structuredLog("generation_blocked", {
        reason: "consultation_not_found",
        patientId,
        consultationId,
      });
      return;
    }

    if (!consultation.medications.length) {
      showStatus("Add at least one medication in the consultation before generating a prescription.", "error");
      setRecoveryMessage("Open F3, update consultation medications, and try generation again.");
      resetPreview();
      structuredLog("generation_blocked", {
        reason: "no_medications",
        patientId,
        consultationId,
      });
      return;
    }

    const document = buildPrescriptionDocument(consultation, patient);
    preview.innerHTML = renderPrescription(document);
    printBtn.disabled = false;
    showStatus("Prescription generated. Review the preview and print when ready.", "success");

    structuredLog("generation_success", {
      result: "success",
      patientId,
      consultationId,
      medicationCount: consultation.medications.length,
      filename: document.filename,
    });
  });

  printBtn.addEventListener("click", () => {
    structuredLog("print_enter");
    window.print();
    showStatus("Print action sent to browser.", "success");
    structuredLog("print_exit");
  });

  clearBtn.addEventListener("click", () => {
    form.reset();
    consultationSelect.innerHTML = `<option value="">Select consultation</option>`;
    consultationSelect.disabled = true;
    setRecoveryMessage("");
    clearStatus();
    resetPreview();
    structuredLog("clear_form");
  });

  patientSelect.addEventListener("change", onPatientChange);

  structuredLog("ui_init_exit");

  return {
    getConsultationsByPatient,
    buildPrescriptionDocument,
  };
}
