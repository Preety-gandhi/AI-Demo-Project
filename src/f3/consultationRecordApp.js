function structuredLog(event, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    feature: "F3",
    event,
    timestamp,
    ...details,
  };
  console.info(JSON.stringify(logEntry));
}

const F1_PATIENT_STORAGE_KEY = "pms.f1.patients";
const F3_CONSULTATION_STORAGE_KEY = "pms.f3.consultations";
const F3_HISTORY_LINKS_KEY = "pms.f3.historyLinks";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function nowIsoString() {
  return new Date().toISOString();
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

function readPatientsFromF1() {
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

class ConsultationStore {
  constructor() {
    this._consultations = this._readPersistedConsultations();
    this._nextId = this._deriveNextId(this._consultations);
  }

  _isStorageAvailable() {
    try {
      return typeof window !== "undefined" && !!window.localStorage;
    } catch {
      return false;
    }
  }

  _readPersistedConsultations() {
    if (!this._isStorageAvailable()) {
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
        complaints: normalizeText(item.complaints),
        diagnosis: normalizeText(item.diagnosis),
        medications: Array.isArray(item.medications) ? item.medications.map(normalizeText).filter(Boolean) : [],
        createdAt: normalizeText(item.createdAt) || nowIsoString(),
      }));
  }

  _persistConsultations() {
    if (!this._isStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify(this._consultations));
  }

  _deriveNextId(consultations) {
    if (!consultations.length) {
      return 1;
    }

    const maxId = consultations.reduce((max, item) => {
      const digits = Number(String(item.id).replace("c-", ""));
      return Number.isFinite(digits) ? Math.max(max, digits) : max;
    }, 0);

    return maxId + 1;
  }

  create(input) {
    const consultation = {
      id: `c-${this._nextId++}`,
      createdAt: nowIsoString(),
      ...input,
    };

    this._consultations.push(consultation);
    this._persistConsultations();
    return consultation;
  }

  getAll() {
    return [...this._consultations];
  }

  getById(id) {
    return this._consultations.find((item) => item.id === id) ?? null;
  }
}

class PatientHistoryStore {
  constructor() {
    this._links = this._readPersistedLinks();
  }

  _isStorageAvailable() {
    try {
      return typeof window !== "undefined" && !!window.localStorage;
    } catch {
      return false;
    }
  }

  _readPersistedLinks() {
    if (!this._isStorageAvailable()) {
      return [];
    }

    const raw = window.localStorage.getItem(F3_HISTORY_LINKS_KEY);
    return safeJsonArray(raw)
      .filter((link) => link && link.patientId && link.consultationId)
      .map((link) => ({
        patientId: normalizeText(link.patientId),
        consultationId: normalizeText(link.consultationId),
        linkedAt: normalizeText(link.linkedAt) || nowIsoString(),
      }));
  }

  _persistLinks() {
    if (!this._isStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(F3_HISTORY_LINKS_KEY, JSON.stringify(this._links));
  }

  linkVisit(patientId, consultationId) {
    const record = {
      patientId: normalizeText(patientId),
      consultationId: normalizeText(consultationId),
      linkedAt: nowIsoString(),
    };

    this._links.push(record);
    this._persistLinks();
    return record;
  }

  getConsultationIdsByPatient(patientId) {
    const normalizedPatientId = normalizeText(patientId);
    return this._links
      .filter((link) => link.patientId === normalizedPatientId)
      .map((link) => link.consultationId);
  }
}

function parseMedications(rawMedications) {
  return rawMedications
    .split(/\n|,/)
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function validate(payload) {
  const errors = {};

  if (!normalizeText(payload.patientId)) {
    errors.patientId = "Patient is required";
  }

  if (!normalizeText(payload.vitals.temperature)) {
    errors.temperature = "Temperature is required";
  }

  if (!normalizeText(payload.vitals.bloodPressure)) {
    errors.bloodPressure = "Blood pressure is required";
  }

  if (!normalizeText(payload.vitals.pulse)) {
    errors.pulse = "Pulse is required";
  }

  return errors;
}

function buildLayout() {
  return `
    <section class="panel">
      <h1>Consultation Record Capture</h1>
      <p class="subtitle">Capture vitals, complaints, diagnosis, and medications in one consultation record.</p>

      <div id="status-message" class="status-message" aria-live="polite"></div>
      <div id="validation-container"></div>

      <form id="consultation-form" novalidate>
        <div class="field-row">
          <label for="patientId">Patient *</label>
          <select id="patientId" name="patientId">
            <option value="">Select patient</option>
          </select>
        </div>

        <h2 class="section-title">Vitals (Mandatory)</h2>

        <div class="field-row">
          <label for="temperature">Temperature *</label>
          <input id="temperature" name="temperature" type="number" step="0.1" placeholder="98.6" />
        </div>

        <div class="field-row">
          <label for="bloodPressure">Blood Pressure *</label>
          <input id="bloodPressure" name="bloodPressure" type="text" placeholder="120/80" />
        </div>

        <div class="field-row">
          <label for="pulse">Pulse *</label>
          <input id="pulse" name="pulse" type="number" placeholder="72" />
        </div>

        <div class="field-row">
          <label for="complaints">Complaints</label>
          <textarea id="complaints" name="complaints" rows="2" placeholder="Patient complaints"></textarea>
        </div>

        <div class="field-row">
          <label for="diagnosis">Diagnosis</label>
          <textarea id="diagnosis" name="diagnosis" rows="2" placeholder="Clinical diagnosis"></textarea>
        </div>

        <div class="field-row">
          <label for="medications">Medications</label>
          <textarea id="medications" name="medications" rows="2" placeholder="One per line or comma separated"></textarea>
        </div>

        <div class="actions">
          <button type="submit" id="save-btn">Save Consultation</button>
          <button type="button" id="reset-btn" class="btn-secondary">Reset</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <h2>Patient Visit History</h2>
      <p class="subtitle small">Consultation records linked to the selected patient.</p>
      <div id="history-list"></div>
    </section>
  `;
}

function renderErrorSummary(errors) {
  const keys = Object.keys(errors);
  if (!keys.length) {
    return "";
  }

  const rows = keys.map((key) => `<li>${errors[key]}</li>`).join("");

  return `
    <div class="error-summary" role="alert" aria-live="assertive">
      <p>Fix the following fields:</p>
      <ul>${rows}</ul>
    </div>
  `;
}

function renderHistory(patientId, historyItems) {
  if (!patientId) {
    return `<p class="empty-state">Select a patient to view consultation history.</p>`;
  }

  if (!historyItems.length) {
    return `<p class="empty-state">No consultation records linked for this patient yet.</p>`;
  }

  const rows = historyItems
    .map((item) => {
      const dateText = new Date(item.createdAt).toLocaleString();
      const medications = item.medications.length ? item.medications.join(", ") : "-";
      return `
        <tr>
          <td>${dateText}</td>
          <td>${item.vitals.temperature}</td>
          <td>${item.vitals.bloodPressure}</td>
          <td>${item.vitals.pulse}</td>
          <td>${item.complaints || "-"}</td>
          <td>${item.diagnosis || "-"}</td>
          <td>${medications}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Captured At</th>
          <th>Temp</th>
          <th>BP</th>
          <th>Pulse</th>
          <th>Complaints</th>
          <th>Diagnosis</th>
          <th>Medications</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildPatientOptions(selectNode, patients) {
  const options = patients
    .map((patient) => `<option value="${patient.id}">${patient.name}</option>`)
    .join("");

  selectNode.insertAdjacentHTML("beforeend", options);
}

const fallbackPatients = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
];

export function createConsultationRecordApp({
  mount,
  consultationStore = new ConsultationStore(),
  historyStore = new PatientHistoryStore(),
  patients,
} = {}) {
  if (!mount) {
    throw new Error("Mount container is required");
  }

  const storedPatients = readPatientsFromF1();
  const resolvedPatients = Array.isArray(patients) && patients.length
    ? patients
    : storedPatients.length
      ? storedPatients
      : fallbackPatients;

  structuredLog("ui_init_enter", { patientCount: resolvedPatients.length });
  mount.innerHTML = buildLayout();

  const form = mount.querySelector("#consultation-form");
  const resetBtn = mount.querySelector("#reset-btn");
  const patientSelect = mount.querySelector("#patientId");
  const validationContainer = mount.querySelector("#validation-container");
  const statusMessage = mount.querySelector("#status-message");
  const historyList = mount.querySelector("#history-list");

  buildPatientOptions(patientSelect, resolvedPatients);

  function showStatus(message, type = "success") {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.className = "status-message";
    statusMessage.textContent = "";
  }

  function readFormPayload() {
    return {
      patientId: normalizeText(form.elements.patientId.value),
      vitals: {
        temperature: normalizeText(form.elements.temperature.value),
        bloodPressure: normalizeText(form.elements.bloodPressure.value),
        pulse: normalizeText(form.elements.pulse.value),
      },
      complaints: normalizeText(form.elements.complaints.value),
      diagnosis: normalizeText(form.elements.diagnosis.value),
      medications: parseMedications(form.elements.medications.value),
    };
  }

  function resetForm({ keepPatientSelection = true } = {}) {
    const patientId = keepPatientSelection ? patientSelect.value : "";
    form.reset();
    patientSelect.value = patientId;
    validationContainer.innerHTML = "";
  }

  function renderPatientHistory(patientId) {
    const linkedIds = historyStore.getConsultationIdsByPatient(patientId);
    const items = linkedIds
      .map((id) => consultationStore.getById(id))
      .filter(Boolean)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    historyList.innerHTML = renderHistory(patientId, items);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    structuredLog("save_enter");
    clearStatus();

    const payload = readFormPayload();
    const errors = validate(payload);
    if (Object.keys(errors).length) {
      validationContainer.innerHTML = renderErrorSummary(errors);
      showStatus("Consultation not saved. Mandatory vitals are missing.", "error");
      structuredLog("consultation_validation_failed", {
        result: "validation_failed",
        errorCount: Object.keys(errors).length,
        errorFields: Object.keys(errors),
      });
      return;
    }

    const consultation = consultationStore.create(payload);
    historyStore.linkVisit(payload.patientId, consultation.id);

    validationContainer.innerHTML = "";
    showStatus("Consultation saved and linked to patient history.", "success");
    renderPatientHistory(payload.patientId);
    resetForm();

    structuredLog("consultation_created", {
      result: "success",
      consultationId: consultation.id,
      vitalsCaptured: ['temperature', 'bloodPressure', 'pulse'],
      complaintsCaptured: !!payload.complaints,
      diagnosisCaptured: !!payload.diagnosis,
      medicationCount: payload.medications.length,
      linkedToPatientHistory: true,
    });
  });

  resetBtn.addEventListener("click", () => {
    structuredLog("reset_enter");
    resetForm();
    clearStatus();
    renderPatientHistory(patientSelect.value);
    structuredLog("reset_exit");
  });

  patientSelect.addEventListener("change", () => {
    structuredLog("patient_change_enter", { patientId: patientSelect.value });
    renderPatientHistory(patientSelect.value);
    structuredLog("patient_change_exit");
  });

  renderPatientHistory(patientSelect.value);
  structuredLog("ui_init_exit");

  return {
    getConsultations: () => consultationStore.getAll(),
  };
}

export { ConsultationStore, PatientHistoryStore };
