function structuredLog(event, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    feature: "F2",
    event,
    timestamp,
    ...details,
  };
  console.info(JSON.stringify(logEntry));
}

const F1_PATIENT_STORAGE_KEY = "pms.f1.patients";
const F2_APPOINTMENT_STORAGE_KEY = "pms.f2.appointments";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function toTimeString(minutes) {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function compareAppointments(a, b) {
  if (a.date === b.date) {
    return toMinutes(a.time) - toMinutes(b.time);
  }
  return a.date.localeCompare(b.date);
}

class InMemoryAppointmentStore {
  constructor() {
    const persistedAppointments = this._readPersistedAppointments();
    this._appointments = persistedAppointments;
    this._nextId = this._deriveNextId(persistedAppointments);
  }

  _isStorageAvailable() {
    try {
      return typeof window !== "undefined" && !!window.localStorage;
    } catch {
      return false;
    }
  }

  _readPersistedAppointments() {
    if (!this._isStorageAvailable()) {
      return [];
    }

    const raw = window.localStorage.getItem(F2_APPOINTMENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((appointment) => appointment && typeof appointment.id === "number")
        .map((appointment) => ({
          id: appointment.id,
          patientId: normalizeText(appointment.patientId),
          date: normalizeText(appointment.date),
          time: normalizeText(appointment.time),
          reason: normalizeText(appointment.reason),
          status: normalizeText(appointment.status) || "Scheduled",
        }));
    } catch {
      return [];
    }
  }

  _persistAppointments() {
    if (!this._isStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(F2_APPOINTMENT_STORAGE_KEY, JSON.stringify(this._appointments));
  }

  _deriveNextId(appointments) {
    if (!appointments.length) {
      return 1;
    }

    const maxId = appointments.reduce((max, appointment) => Math.max(max, appointment.id), 0);
    return maxId + 1;
  }

  create(input) {
    const appointment = { id: this._nextId++, status: "Scheduled", ...input };
    this._appointments.push(appointment);
    this._persistAppointments();
    return appointment;
  }

  update(id, input) {
    const index = this._appointments.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }
    const updated = { ...this._appointments[index], ...input, status: "Scheduled" };
    this._appointments[index] = updated;
    this._persistAppointments();
    return updated;
  }

  findById(id) {
    return this._appointments.find((item) => item.id === id) ?? null;
  }

  getByDate(date) {
    return this._appointments
      .filter((item) => item.date === date)
      .sort(compareAppointments);
  }

  hasConflict(date, time, excludingId = null) {
    return this._appointments.some(
      (item) => item.date === date && item.time === time && item.id !== excludingId,
    );
  }
}

function buildLayout() {
  const today = todayIsoDate();

  return `
    <section class="panel">
      <h1>Appointment Scheduling</h1>
      <p class="subtitle">Create, review, and update daily clinic appointments.</p>

      <div id="status-message" class="status-message" aria-live="polite"></div>
      <div id="validation-container"></div>

      <form id="appointment-form" novalidate>
        <div class="field-row">
          <label for="patientId">Patient *</label>
          <select id="patientId" name="patientId">
            <option value="">Select a patient</option>
          </select>
        </div>

        <div class="field-row">
          <label for="date">Date *</label>
          <input id="date" name="date" type="date" value="${today}" />
        </div>

        <div class="field-row">
          <label for="time">Time *</label>
          <input id="time" name="time" type="time" />
        </div>

        <div class="field-row">
          <label for="reason">Reason</label>
          <input id="reason" name="reason" type="text" placeholder="Follow-up, review, etc." />
        </div>

        <div class="actions">
          <button id="submit-btn" type="submit">Save Appointment</button>
          <button id="cancel-edit-btn" type="button" class="btn-secondary" hidden>Cancel Edit</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="schedule-head">
        <h2>Daily Schedule</h2>
        <label for="scheduleDate" class="compact-label">View date</label>
        <input id="scheduleDate" type="date" value="${today}" />
      </div>
      <div id="schedule-list"></div>
    </section>
  `;
}

function renderErrorSummary(errors) {
  const keys = Object.keys(errors);
  if (!keys.length) {
    return "";
  }

  const rows = keys.map((field) => `<li>${errors[field]}</li>`).join("");

  return `
    <div class="error-summary" role="alert" aria-live="assertive">
      <p>Resolve the following:</p>
      <ul>${rows}</ul>
    </div>
  `;
}

function renderAlternatives(date, alternatives) {
  if (!alternatives.length) {
    return "";
  }

  const tags = alternatives
    .map((time) => `<button type="button" class="alt-chip" data-alt-time="${time}" data-alt-date="${date}">${time}</button>`)
    .join("");

  return `
    <div class="alt-wrap">
      <p>Suggested available slots:</p>
      <div class="alt-grid">${tags}</div>
    </div>
  `;
}

function renderSchedule(date, appointments, patientMap) {
  if (!appointments.length) {
    return `<p class="empty-state">No appointments scheduled on ${date}.</p>`;
  }

  const rows = appointments
    .map((appointment) => {
      const patientName = patientMap.get(appointment.patientId) ?? appointment.patientId;
      return `
        <tr>
          <td>${appointment.time}</td>
          <td>${patientName}</td>
          <td>${appointment.reason || "-"}</td>
          <td><span class="status-badge">${appointment.status}</span></td>
          <td>
            <button type="button" class="btn-secondary" data-edit-id="${appointment.id}">Edit</button>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Patient</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function deriveAlternatives(date, time, store, excludingId = null) {
  const start = toMinutes(time);
  const alternatives = [];
  const offsets = [30, 60, 90, 120, -30, -60];

  for (const offset of offsets) {
    const candidateTime = toTimeString(start + offset);
    const isBusy = store.hasConflict(date, candidateTime, excludingId);
    if (!isBusy && !alternatives.includes(candidateTime)) {
      alternatives.push(candidateTime);
    }
    if (alternatives.length === 3) {
      break;
    }
  }

  return alternatives;
}

function validate(payload) {
  const errors = {};

  if (!normalizeText(payload.patientId)) {
    errors.patientId = "Patient is required";
  }

  if (!normalizeText(payload.date)) {
    errors.date = "Date is required";
  }

  if (!normalizeText(payload.time)) {
    errors.time = "Time is required";
  }

  return errors;
}

function buildPatientOptions(selectNode, patients) {
  const options = patients
    .map((patient) => `<option value="${patient.id}">${patient.name}</option>`)
    .join("");
  selectNode.insertAdjacentHTML("beforeend", options);
}

const defaultPatients = [
  { id: "p-001", name: "John Doe" },
  { id: "p-002", name: "Jane Smith" },
  { id: "p-003", name: "Robert Brown" },
];

function loadPatientsFromF1Storage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const raw = window.localStorage.getItem(F1_PATIENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((patient) => patient && patient.id !== undefined)
      .map((patient) => ({
        id: String(patient.id),
        name: normalizeText(patient.name) || "Unnamed Patient",
      }))
      .filter((patient) => patient.id && patient.name);
  } catch {
    return [];
  }
}

export function createAppointmentSchedulingApp({
  mount,
  store = new InMemoryAppointmentStore(),
  patients,
} = {}) {
  if (!mount) {
    throw new Error("Mount container is required");
  }

  structuredLog("ui_init_enter");
  mount.innerHTML = buildLayout();

  const storedPatients = loadPatientsFromF1Storage();
  const resolvedPatients = Array.isArray(patients) && patients.length
    ? patients
    : storedPatients.length
      ? storedPatients
      : defaultPatients;

  const form = mount.querySelector("#appointment-form");
  const patientSelect = mount.querySelector("#patientId");
  const dateInput = mount.querySelector("#date");
  const timeInput = mount.querySelector("#time");
  const reasonInput = mount.querySelector("#reason");
  const submitBtn = mount.querySelector("#submit-btn");
  const cancelEditBtn = mount.querySelector("#cancel-edit-btn");
  const validationContainer = mount.querySelector("#validation-container");
  const statusMessage = mount.querySelector("#status-message");
  const scheduleDateInput = mount.querySelector("#scheduleDate");
  const scheduleList = mount.querySelector("#schedule-list");

  const patientMap = new Map(resolvedPatients.map((patient) => [patient.id, patient.name]));

  let editingId = null;
  let activeAlternatives = [];

  buildPatientOptions(patientSelect, resolvedPatients);

  function showStatus(message, type = "success") {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.className = "status-message";
    statusMessage.textContent = "";
  }

  function renderScheduleList() {
    const date = scheduleDateInput.value;
    const appointments = store.getByDate(date);
    scheduleList.innerHTML = renderSchedule(date, appointments, patientMap);
  }

  function clearEditMode({ clearStatusMessage = false } = {}) {
    editingId = null;
    submitBtn.textContent = "Save Appointment";
    cancelEditBtn.hidden = true;
    form.reset();
    const defaultDate = scheduleDateInput.value || todayIsoDate();
    dateInput.value = defaultDate;
    activeAlternatives = [];
    if (clearStatusMessage) {
      clearStatus();
    }
  }

  function readPayload() {
    return {
      patientId: normalizeText(patientSelect.value),
      date: normalizeText(dateInput.value),
      time: normalizeText(timeInput.value),
      reason: normalizeText(reasonInput.value),
    };
  }

  function hydrateForEdit(appointment) {
    editingId = appointment.id;
    patientSelect.value = appointment.patientId;
    dateInput.value = appointment.date;
    timeInput.value = appointment.time;
    reasonInput.value = appointment.reason || "";
    submitBtn.textContent = "Update Appointment";
    cancelEditBtn.hidden = false;
    showStatus(`Editing ${appointment.time} appointment`, "info");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    structuredLog("submit_enter", { editingId });

    clearStatus();
    const payload = readPayload();
    const errors = validate(payload);

    if (Object.keys(errors).length) {
      validationContainer.innerHTML = renderErrorSummary(errors);
      activeAlternatives = [];
      structuredLog("appointment_validation_failed", {
        result: "validation_failed",
        errorCount: Object.keys(errors).length,
        errorFields: Object.keys(errors),
      });
      return;
    }

    const conflict = store.hasConflict(payload.date, payload.time, editingId);
    if (conflict) {
      activeAlternatives = deriveAlternatives(payload.date, payload.time, store, editingId);
      validationContainer.innerHTML = `${renderErrorSummary({
        conflict: "Requested slot is unavailable.",
      })}${renderAlternatives(payload.date, activeAlternatives)}`;
      showStatus("Appointment not saved because the slot is unavailable.", "error");
      structuredLog("appointment_conflict", {
        result: "conflict_rejected",
        reason: "time_slot_unavailable",
        requestedDate: payload.date,
        requestedTime: payload.time,
        alternativesCount: activeAlternatives.length,
      });
      return;
    }

    if (editingId === null) {
      const appointment = store.create(payload);
      showStatus("Appointment saved with status Scheduled.");
      structuredLog("appointment_created", {
        result: "success",
        appointmentId: appointment.id,
        date: payload.date,
        time: payload.time,
        status: appointment.status,
      });
    } else {
      const updated = store.update(editingId, payload);
      if (!updated) {
        showStatus("Unable to update appointment. Please retry.", "error");
        structuredLog("appointment_update_failed", {
          result: "update_failed",
          reason: "appointment_not_found",
          appointmentId: editingId,
        });
        return;
      }
      showStatus("Appointment updated successfully.");
      structuredLog("appointment_updated", {
        result: "success",
        appointmentId: editingId,
        date: payload.date,
        time: payload.time,
      });
    }

    validationContainer.innerHTML = "";
    activeAlternatives = [];
    scheduleDateInput.value = payload.date;
    renderScheduleList();
    clearEditMode();
  });

  cancelEditBtn.addEventListener("click", () => {
    clearEditMode({ clearStatusMessage: true });
    showStatus("Edit cancelled.", "info");
    structuredLog("cancel_edit");
  });

  scheduleDateInput.addEventListener("change", () => {
    renderScheduleList();
    structuredLog("schedule_date_change", { date: scheduleDateInput.value });
  });

  scheduleList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const altTime = target.getAttribute("data-alt-time");
    const altDate = target.getAttribute("data-alt-date");
    if (altTime && altDate) {
      timeInput.value = altTime;
      dateInput.value = altDate;
      validationContainer.innerHTML = "";
      showStatus(`Selected suggested slot ${altDate} ${altTime}.`, "info");
      structuredLog("alternative_selected", { altDate, altTime });
      return;
    }

    const idValue = target.getAttribute("data-edit-id");
    if (!idValue) {
      return;
    }

    const id = Number(idValue);
    const appointment = store.findById(id);
    if (!appointment) {
      showStatus("Appointment not found.", "error");
      structuredLog("edit_not_found", { id });
      return;
    }

    hydrateForEdit(appointment);
    structuredLog("edit_enter", { id });
  });

  renderScheduleList();
  structuredLog("ui_init_exit");

  return {
    getAppointmentsByDate: (date) => store.getByDate(date),
  };
}

export { InMemoryAppointmentStore };
