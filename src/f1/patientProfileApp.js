const requiredFields = ["name", "contact"];
const PATIENT_STORAGE_KEY = "pms.f1.patients";

function structuredLog(event, details = {}) {
  console.info(JSON.stringify({ feature: "F1", event, ...details }));
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function toPatientPayload(formValues) {
  return {
    name: normalizeText(formValues.name),
    contact: normalizeText(formValues.contact),
    dateOfBirth: normalizeText(formValues.dateOfBirth),
    gender: normalizeText(formValues.gender),
    address: normalizeText(formValues.address),
  };
}

class InMemoryPatientStore {
  constructor() {
    const persistedPatients = this._readPersistedPatients();
    this._patients = persistedPatients;
    this._nextId = this._deriveNextId(persistedPatients);
  }

  _isStorageAvailable() {
    try {
      return typeof window !== "undefined" && !!window.localStorage;
    } catch {
      return false;
    }
  }

  _readPersistedPatients() {
    if (!this._isStorageAvailable()) {
      return [];
    }

    const raw = window.localStorage.getItem(PATIENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((patient) => patient && typeof patient.id === "number")
        .map((patient) => ({
          id: patient.id,
          name: normalizeText(patient.name),
          contact: normalizeText(patient.contact),
          dateOfBirth: normalizeText(patient.dateOfBirth),
          gender: normalizeText(patient.gender),
          address: normalizeText(patient.address),
        }));
    } catch {
      return [];
    }
  }

  _persistPatients() {
    if (!this._isStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(this._patients));
  }

  _deriveNextId(patients) {
    if (!patients.length) {
      return 1;
    }

    const maxId = patients.reduce((max, patient) => Math.max(max, patient.id), 0);
    return maxId + 1;
  }

  getAll() {
    return [...this._patients];
  }

  findById(id) {
    return this._patients.find((patient) => patient.id === id) ?? null;
  }

  findByNameAndContact(name, contact) {
    const normalizedName = normalizeText(name).toLowerCase();
    const normalizedContact = normalizeText(contact);
    return (
      this._patients.find(
        (patient) =>
          patient.name.toLowerCase() === normalizedName &&
          patient.contact === normalizedContact,
      ) ?? null
    );
  }

  create(patientInput) {
    const patient = { id: this._nextId++, ...patientInput };
    this._patients.push(patient);
    this._persistPatients();
    return patient;
  }

  update(id, patientInput) {
    const index = this._patients.findIndex((patient) => patient.id === id);
    if (index === -1) {
      return null;
    }

    const updated = { ...this._patients[index], ...patientInput };
    this._patients[index] = updated;
    this._persistPatients();
    return updated;
  }
}

function renderPatientList(patients) {
  if (!patients.length) {
    return `<p class="empty-state">No patients registered yet.</p>`;
  }

  const rows = patients
    .map(
      (patient) => `
      <tr>
        <td>${patient.name}</td>
        <td>${patient.contact}</td>
        <td>${patient.dateOfBirth || "-"}</td>
        <td>${patient.gender || "-"}</td>
        <td>${patient.address || "-"}</td>
        <td>
          <button type="button" class="btn-secondary" data-edit-id="${patient.id}">Edit</button>
        </td>
      </tr>`,
    )
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact</th>
          <th>Date of Birth</th>
          <th>Gender</th>
          <th>Address</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderErrorSummary(errors) {
  const fields = Object.keys(errors);
  if (!fields.length) {
    return "";
  }

  const messages = fields
    .map((field) => `<li>${errors[field]}</li>`)
    .join("");

  return `
    <div class="error-summary" role="alert" aria-live="assertive">
      <p>Please fix the following fields:</p>
      <ul>${messages}</ul>
    </div>
  `;
}

function validate(formValues) {
  const errors = {};

  for (const field of requiredFields) {
    if (!normalizeText(formValues[field])) {
      errors[field] = `${field[0].toUpperCase() + field.slice(1)} is required`;
    }
  }

  return errors;
}

function buildLayout() {
  return `
    <section class="panel">
      <h1>Patient Profile Management</h1>
      <p class="subtitle">Register, view, and update patient details from one screen.</p>

      <div id="status-message" class="status-message" aria-live="polite"></div>
      <div id="validation-container"></div>

      <form id="patient-form" novalidate>
        <div class="field-row">
          <label for="name">Name *</label>
          <input id="name" name="name" type="text" autocomplete="name" />
        </div>

        <div class="field-row">
          <label for="contact">Contact *</label>
          <input id="contact" name="contact" type="text" inputmode="tel" />
        </div>

        <div class="field-row">
          <label for="dateOfBirth">Date of Birth</label>
          <input id="dateOfBirth" name="dateOfBirth" type="date" />
        </div>

        <div class="field-row">
          <label for="gender">Gender</label>
          <select id="gender" name="gender">
            <option value="">Select</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div class="field-row">
          <label for="address">Address</label>
          <textarea id="address" name="address" rows="2"></textarea>
        </div>

        <div class="actions">
          <button id="submit-btn" type="submit">Save Patient</button>
          <button id="cancel-edit-btn" type="button" class="btn-secondary" hidden>Cancel Edit</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <h2>Patient List</h2>
      <div id="patient-list"></div>
    </section>
  `;
}

export function createPatientProfileApp({ mount, store = new InMemoryPatientStore() }) {
  if (!mount) {
    throw new Error("Mount container is required");
  }

  structuredLog("ui_init_enter");
  mount.innerHTML = buildLayout();

  const form = mount.querySelector("#patient-form");
  const submitBtn = mount.querySelector("#submit-btn");
  const cancelEditBtn = mount.querySelector("#cancel-edit-btn");
  const patientListContainer = mount.querySelector("#patient-list");
  const validationContainer = mount.querySelector("#validation-container");
  const statusMessage = mount.querySelector("#status-message");

  let editingPatientId = null;

  function showStatus(message, type = "success") {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.className = "status-message";
    statusMessage.textContent = "";
  }

  function readFormValues() {
    return {
      name: form.elements.name.value,
      contact: form.elements.contact.value,
      dateOfBirth: form.elements.dateOfBirth.value,
      gender: form.elements.gender.value,
      address: form.elements.address.value,
    };
  }

  function writeFormValues(patient) {
    form.elements.name.value = patient.name || "";
    form.elements.contact.value = patient.contact || "";
    form.elements.dateOfBirth.value = patient.dateOfBirth || "";
    form.elements.gender.value = patient.gender || "";
    form.elements.address.value = patient.address || "";
  }

  function resetForm() {
    form.reset();
    validationContainer.innerHTML = "";
  }

  function setEditMode(patient) {
    editingPatientId = patient.id;
    writeFormValues(patient);
    submitBtn.textContent = "Update Patient";
    cancelEditBtn.hidden = false;
    showStatus(`Editing profile: ${patient.name}`, "info");
  }

  function clearEditMode() {
    editingPatientId = null;
    submitBtn.textContent = "Save Patient";
    cancelEditBtn.hidden = true;
    resetForm();
    clearStatus();
  }

  function renderPatients() {
    const patients = store.getAll();
    patientListContainer.innerHTML = renderPatientList(patients);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    structuredLog("submit_enter", { editingPatientId });
    clearStatus();

    const payload = toPatientPayload(readFormValues());
    const errors = validate(payload);

    if (Object.keys(errors).length > 0) {
      validationContainer.innerHTML = renderErrorSummary(errors);
      structuredLog("submit_exit", { result: "validation_failed", errors });
      return;
    }

    if (editingPatientId === null) {
      const duplicate = store.findByNameAndContact(payload.name, payload.contact);
      if (duplicate) {
        const shouldCreateDuplicate = window.confirm(
          "A patient with this Name and Contact already exists. Do you still want to create a new record?",
        );

        if (!shouldCreateDuplicate) {
          showStatus("Duplicate patient detected. Review details before saving.", "error");
          structuredLog("submit_exit", { result: "duplicate_cancelled" });
          return;
        }
      }

      store.create(payload);
      showStatus("Patient profile created successfully.");
    } else {
      const updated = store.update(editingPatientId, payload);
      if (!updated) {
        showStatus("Unable to update patient profile. Please retry.", "error");
        structuredLog("submit_exit", { result: "update_failed_missing_id" });
        return;
      }
      showStatus("Patient profile updated successfully.");
    }

    validationContainer.innerHTML = "";
    renderPatients();
    clearEditMode();
    structuredLog("submit_exit", { result: "success" });
  });

  cancelEditBtn.addEventListener("click", () => {
    clearEditMode();
    showStatus("Edit cancelled.", "info");
    structuredLog("cancel_edit");
  });

  patientListContainer.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const editIdValue = target.getAttribute("data-edit-id");
    if (!editIdValue) {
      return;
    }

    const editId = Number(editIdValue);
    const patient = store.findById(editId);
    if (!patient) {
      showStatus("Patient could not be found.", "error");
      structuredLog("edit_not_found", { editId });
      return;
    }

    setEditMode(patient);
    structuredLog("edit_enter", { editId });
  });

  renderPatients();
  structuredLog("ui_init_exit");

  return {
    getPatients: () => store.getAll(),
    loadPatientForEdit: (id) => {
      const patient = store.findById(id);
      if (patient) {
        setEditMode(patient);
      }
    },
  };
}

export { InMemoryPatientStore };
