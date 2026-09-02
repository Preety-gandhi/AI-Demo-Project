import { readPatients, getPatientHistory, filterHistoryByDateRange } from "./visitHistoryService.js";

function structuredLog(event, details = {}) {
  console.info(JSON.stringify({ feature: "F5", event, timestamp: new Date().toISOString(), ...details }));
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function buildLayout() {
  return `
    <section class="panel">
      <h1>Visit History Review</h1>
      <p class="subtitle">Review a patient's prior visits and filter by date range.</p>

      <div class="field-row">
        <label for="patientId">Patient *</label>
        <select id="patientId" name="patientId">
          <option value="">Select patient</option>
        </select>
      </div>

      <form id="date-filter-form" novalidate>
        <div class="field-row">
          <label for="startDate">Start date</label>
          <input type="date" id="startDate" name="startDate" />
        </div>
        <div class="field-row">
          <label for="endDate">End date</label>
          <input type="date" id="endDate" name="endDate" />
        </div>
        <div class="actions">
          <button id="apply-filter-btn" type="submit">Apply Filter</button>
          <button id="clear-filter-btn" type="button" class="btn-secondary">Clear Filter</button>
        </div>
      </form>

      <div id="status-message" class="status-message" aria-live="polite"></div>
    </section>

    <section class="panel">
      <h2>Visits</h2>
      <div id="visit-list"><p class="preview-empty">Select a patient to view visit history.</p></div>
    </section>
  `;
}

function renderVisitList(visits) {
  if (!visits.length) {
    return `<p class="preview-empty">No visits found.</p>`;
  }

  return visits
    .map(
      (visit) => `
        <article class="visit-card">
          <header class="visit-card-head">
            <strong>${formatDate(visit.createdAt)}</strong>
            <span>${visit.diagnosis || "-"}</span>
          </header>
          <p><strong>Vitals:</strong> Temp ${visit.vitals.temperature || "-"}, BP ${visit.vitals.bloodPressure || "-"}, Pulse ${visit.vitals.pulse || "-"}</p>
          <p><strong>Complaints:</strong> ${visit.complaints || "-"}</p>
          <p><strong>Prescriptions:</strong> ${visit.prescriptions.length ? visit.prescriptions.join(", ") : "-"}</p>
        </article>
      `,
    )
    .join("");
}

export function createVisitHistoryApp({ mount } = {}) {
  if (!mount) {
    throw new Error("Mount container is required");
  }

  const patients = readPatients();

  mount.innerHTML = buildLayout();

  const patientSelect = mount.querySelector("#patientId");
  const filterForm = mount.querySelector("#date-filter-form");
  const startDateInput = mount.querySelector("#startDate");
  const endDateInput = mount.querySelector("#endDate");
  const clearFilterBtn = mount.querySelector("#clear-filter-btn");
  const statusMessage = mount.querySelector("#status-message");
  const visitList = mount.querySelector("#visit-list");

  const patientOptions = patients.map((patient) => `<option value="${patient.id}">${patient.name}</option>`).join("");
  patientSelect.insertAdjacentHTML("beforeend", patientOptions);

  if (!patients.length) {
    patientSelect.disabled = true;
    showStatus("No registered patients found. Register patients in F1 first.", "error");
  }

  function showStatus(message, type = "success") {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.className = "status-message";
    statusMessage.textContent = "";
  }

  function renderForPatient(patientId) {
    if (!patientId) {
      visitList.innerHTML = `<p class="preview-empty">Select a patient to view visit history.</p>`;
      return;
    }

    const visits = getPatientHistory(patientId);
    visitList.innerHTML = renderVisitList(visits);
    structuredLog("history_loaded", { patientId, visitCount: visits.length });
  }

  patientSelect.addEventListener("change", () => {
    clearStatus();
    startDateInput.value = "";
    endDateInput.value = "";
    renderForPatient(patientSelect.value);
  });

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearStatus();

    const patientId = patientSelect.value;
    if (!patientId) {
      showStatus("Select a patient before applying a date filter.", "error");
      return;
    }

    const result = filterHistoryByDateRange(patientId, startDateInput.value, endDateInput.value);
    if (!result.success) {
      showStatus(result.error, "error");
      structuredLog("filter_blocked", { patientId, reason: result.error });
      return;
    }

    visitList.innerHTML = renderVisitList(result.visits);
    showStatus(result.visits.length ? "Filter applied." : "No visits match the selected date range.", "success");
    structuredLog("filter_applied", { patientId, visitCount: result.visits.length });
  });

  clearFilterBtn.addEventListener("click", () => {
    startDateInput.value = "";
    endDateInput.value = "";
    clearStatus();
    renderForPatient(patientSelect.value);
  });

  return { renderForPatient };
}
