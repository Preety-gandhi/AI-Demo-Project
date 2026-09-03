import { beforeEach, describe, expect, it } from "vitest";
import { searchPatients } from "../../src/f6/patientSearchService.js";

const F1_PATIENT_STORAGE_KEY = "pms.f1.patients";

function createLocalStorage() {
  const values = new Map();

  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

describe("F6 integration with F1 - Patient Search and Navigation", () => {
  beforeEach(() => {
    global.window = global;
    global.localStorage = createLocalStorage();
    global.localStorage.setItem(
      F1_PATIENT_STORAGE_KEY,
      JSON.stringify([
        { id: 1, name: "John Doe", contact: "1234567890", lastActivity: "2026-08-10" },
        { id: 2, name: "Jane Doe", contact: "1230000000", lastActivity: "2026-08-12" },
        { id: 3, name: "Sam Patel", contact: "9876543210", lastActivity: "2026-08-05" },
      ]),
    );
  });

  it("test_AC1_searches registered F1 patients by full or partial name in relevance order", () => {
    const result = searchPatients("Doe");

    expect(result.success).toBe(true);
    expect(result.patients.map((patient) => patient.id)).toEqual(["2", "1"]);
    expect(result.patients.map((patient) => patient.name)).toEqual(["Jane Doe", "John Doe"]);
  });

  it("test_AC1_searches registered F1 patients by contact number and opens both record destinations", () => {
    const result = searchPatients("9876543210");

    expect(result.success).toBe(true);
    expect(result.patients).toHaveLength(1);
    expect(result.patients[0]).toMatchObject({
      id: "3",
      name: "Sam Patel",
      profileUrl: "../f1/index.html?patientId=3",
      historyUrl: "../f5/index.html?patientId=3",
    });
  });

  it("test_AC2_returns_no_results_message_and_create_patient_recovery_for_unknown_patient", () => {
    const result = searchPatients("Unknown Patient");

    expect(result).toEqual({
      success: true,
      patients: [],
      message: "No results found. Create a new patient.",
      createPatientUrl: "../f1/index.html",
    });
  });
});
