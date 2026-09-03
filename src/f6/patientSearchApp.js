import { searchPatients } from "./patientSearchService.js";

function structuredLog(event, details = {}) {
  console.info(JSON.stringify({ feature: "F6", event, timestamp: new Date().toISOString(), ...details }));
}

function buildLayout() {
  return `
    <section class="panel">
      <h1>Patient Search and Navigation</h1>
      <p class="subtitle">Search by patient name or phone number to quickly open a record.</p>

      <form id="search-form" novalidate>
        <div class="field-row">
          <label for="query">Search *</label>
          <input type="text" id="query" name="query" placeholder="Name or phone number" autocomplete="off" />
        </div>
        <div class="actions">
          <button id="search-btn" type="submit">Search</button>
          <button id="clear-btn" type="button" class="btn-secondary">Clear</button>
        </div>
      </form>

      <div id="status-message" class="status-message" aria-live="polite"></div>
    </section>

    <section class="panel">
      <h2>Results</h2>
      <div id="results-list"><p class="preview-empty">Enter a search term to find a patient.</p></div>
    </section>
  `;
}

function renderResults(patients) {
  return patients
    .map(
      (patient) => `
        <article class="result-card" data-patient-id="${patient.id}">
          <header class="result-card-head">
            <strong>${patient.name}</strong>
            <span>${patient.contact || "-"}</span>
          </header>
          <p><strong>Last activity:</strong> ${patient.lastActivity || "-"}</p>
          <div class="actions">
            <a class="launch-btn" href="${patient.profileUrl}" data-action="open-profile">Open Profile</a>
            <a class="launch-btn btn-secondary" href="${patient.historyUrl}" data-action="open-history">View History</a>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderNoResults(message, createPatientUrl) {
  return `
    <div class="no-results">
      <p class="preview-empty">${message}</p>
      <a class="launch-btn" href="${createPatientUrl}" data-action="create-patient">Create New Patient</a>
    </div>
  `;
}

export function createPatientSearchApp({ mount } = {}) {
  if (!mount) {
    throw new Error("Mount container is required");
  }

  mount.innerHTML = buildLayout();

  const form = mount.querySelector("#search-form");
  const queryInput = mount.querySelector("#query");
  const clearBtn = mount.querySelector("#clear-btn");
  const statusMessage = mount.querySelector("#status-message");
  const resultsList = mount.querySelector("#results-list");

  function showStatus(message, type = "success") {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.className = "status-message";
    statusMessage.textContent = "";
  }

  function resetResults() {
    resultsList.innerHTML = `<p class="preview-empty">Enter a search term to find a patient.</p>`;
  }

  function runSearch(query) {
    const trimmed = String(query ?? "").trim();

    if (!trimmed) {
      showStatus("Enter a name or phone number to search.", "error");
      resetResults();
      structuredLog("search_blocked", { reason: "empty_query" });
      return;
    }

    clearStatus();
    const result = searchPatients(trimmed);

    if (!result.patients.length) {
      resultsList.innerHTML = renderNoResults(result.message, result.createPatientUrl);
      structuredLog("search_no_results", { query: trimmed });
      return;
    }

    resultsList.innerHTML = renderResults(result.patients);
    structuredLog("search_success", { query: trimmed, resultCount: result.patients.length });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch(queryInput.value);
  });

  clearBtn.addEventListener("click", () => {
    form.reset();
    clearStatus();
    resetResults();
    structuredLog("clear_search");
  });

  return { runSearch };
}
