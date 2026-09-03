import { exportData, readExportDatasets } from "./dataExportService.js";

function structuredLog(event, details = {}) {
  console.info(JSON.stringify({ feature: "F7", event, timestamp: new Date().toISOString(), ...details }));
}

function buildLayout() {
  return `
    <section class="panel">
      <div class="eyebrow">F7 / RECORDKEEPING</div>
      <h1>Data Export</h1>
      <p class="subtitle">Download patient or visit records in a standard format.</p>

      <form id="export-form" novalidate>
        <div class="field-row">
          <label for="dataset">Dataset</label>
          <select id="dataset" name="dataset">
            <option value="patients">Patient records</option>
            <option value="visits">Visit records</option>
          </select>
        </div>
        <div class="field-row">
          <label for="format">Format</label>
          <select id="format" name="format">
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <div class="actions">
          <button id="export-btn" type="submit">Export File</button>
          <button id="refresh-btn" type="button" class="btn-secondary">Refresh Data</button>
        </div>
      </form>
      <p id="status-message" class="status-message" aria-live="polite"></p>
    </section>

    <section class="panel export-summary">
      <div>
        <span class="summary-label">Selected dataset</span>
        <strong id="dataset-label">Patient records</strong>
      </div>
      <div>
        <span class="summary-label">Available records</span>
        <strong id="record-count">0</strong>
      </div>
      <div>
        <span class="summary-label">Latest export</span>
        <strong id="latest-export">None</strong>
      </div>
    </section>
  `;
}

export function createDataExportApp({ mount } = {}) {
  if (!mount) {
    throw new Error("Mount container is required");
  }

  mount.innerHTML = buildLayout();

  const form = mount.querySelector("#export-form");
  const datasetSelect = mount.querySelector("#dataset");
  const formatSelect = mount.querySelector("#format");
  const exportButton = mount.querySelector("#export-btn");
  const refreshButton = mount.querySelector("#refresh-btn");
  const statusMessage = mount.querySelector("#status-message");
  const datasetLabel = mount.querySelector("#dataset-label");
  const recordCount = mount.querySelector("#record-count");
  const latestExport = mount.querySelector("#latest-export");

  let datasets = readExportDatasets();

  function showStatus(message, type = "success") {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
  }

  function updateSummary() {
    const datasetName = datasetSelect.value;
    datasetLabel.textContent = datasetName === "patients" ? "Patient records" : "Visit records";
    recordCount.textContent = String(datasets[datasetName].length);
    exportButton.disabled = datasets[datasetName].length === 0;
  }

  function downloadFile(file) {
    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function refresh() {
    datasets = readExportDatasets();
    updateSummary();
  }

  datasetSelect.addEventListener("change", () => {
    updateSummary();
    showStatus("");
  });

  refreshButton.addEventListener("click", () => {
    refresh();
    showStatus("Available records refreshed.");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const datasetName = datasetSelect.value;
    const format = formatSelect.value;
    const result = exportData(datasets[datasetName], format, datasetName);

    if (!result.success) {
      showStatus(result.error, "error");
      structuredLog("export_blocked", { datasetName, format, reason: result.error });
      return;
    }

    downloadFile(result);
    latestExport.textContent = result.fileName;
    showStatus(`${result.fileName} downloaded successfully.`);
    structuredLog("export_success", { datasetName, format, recordCount: datasets[datasetName].length });
  });

  updateSummary();

  return { refresh };
}
