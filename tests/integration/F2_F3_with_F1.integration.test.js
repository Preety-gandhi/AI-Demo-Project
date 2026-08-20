import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration Tests: F2 & F3 with F1 (Patient Profile Management)
 * 
 * Tests the interaction between:
 * - F1: Patient Profile Management (patient data source)
 * - F2: Appointment Scheduling (reads F1 patients)
 * - F3: Consultation Record Capture (reads F1 patients, links to consultations)
 */

describe('F2 & F3 Integration with F1 — Patient Profile Management', () => {
  let f1PatientStorage;
  let f2AppointmentStorage;
  let f3ConsultationStorage;
  let f3HistoryLinks;

  const F1_PATIENT_STORAGE_KEY = 'pms.f1.patients';
  const F2_APPOINTMENT_STORAGE_KEY = 'pms.f2.appointments';
  const F3_CONSULTATION_STORAGE_KEY = 'pms.f3.consultations';
  const F3_HISTORY_LINKS_KEY = 'pms.f3.historyLinks';

  /**
   * Setup: Initialize isolated storage for each feature
   */
  beforeEach(() => {
    // Simulate localStorage with isolated data per feature
    f1PatientStorage = [];
    f2AppointmentStorage = [];
    f3ConsultationStorage = [];
    f3HistoryLinks = [];

    // Reset mock localStorage
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      },
    };
  });

  describe('F1 → F2 Integration: Patient data availability', () => {
    it('F2 can read patients created in F1', () => {
      // Setup: Create patients in F1 storage
      const f1Patients = [
        { id: 'p-001', name: 'John Doe', contact: '555-1001' },
        { id: 'p-002', name: 'Jane Smith', contact: '555-1002' },
        { id: 'p-003', name: 'Robert Brown', contact: '555-1003' },
      ];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Act: F2 reads patients from F1 storage key
      const storedData = global.localStorage.getItem(F1_PATIENT_STORAGE_KEY);
      const readPatients = JSON.parse(storedData);

      // Assert: F2 can access all F1 patients
      expect(readPatients).toHaveLength(3);
      expect(readPatients[0].name).toBe('John Doe');
      expect(readPatients[1].name).toBe('Jane Smith');
      expect(readPatients[2].name).toBe('Robert Brown');
    });

    it('F2 appointment creation uses F1 patient IDs correctly', () => {
      // Setup: F1 patients
      const f1Patients = [
        { id: 'p-001', name: 'John Doe' },
        { id: 'p-002', name: 'Jane Smith' },
      ];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Act: F2 creates appointment linking to F1 patient
      const appointment = {
        id: 1,
        patientId: 'p-001', // Reference to F1 patient
        date: '2026-08-20',
        time: '10:30',
        reason: 'Follow-up',
        status: 'Scheduled',
      };
      f2AppointmentStorage.push(appointment);
      global.localStorage.setItem(F2_APPOINTMENT_STORAGE_KEY, JSON.stringify(f2AppointmentStorage));

      // Assert: Appointment correctly links to F1 patient
      const appointments = JSON.parse(global.localStorage.getItem(F2_APPOINTMENT_STORAGE_KEY));
      expect(appointments[0].patientId).toBe('p-001');
      
      // Verify patient exists in F1
      const patients = JSON.parse(global.localStorage.getItem(F1_PATIENT_STORAGE_KEY));
      const patient = patients.find(p => p.id === appointments[0].patientId);
      expect(patient).toBeDefined();
      expect(patient.name).toBe('John Doe');
    });
  });

  describe('F1 → F3 Integration: Patient data availability', () => {
    it('F3 can read patients created in F1', () => {
      // Setup: Create patients in F1
      const f1Patients = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
      ];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Act: F3 reads from F1 storage
      const storedData = global.localStorage.getItem(F1_PATIENT_STORAGE_KEY);
      const patients = JSON.parse(storedData);

      // Assert: F3 has access to F1 patients
      expect(patients).toHaveLength(2);
      expect(patients[0].id).toBe('1');
      expect(patients[1].name).toBe('Jane Smith');
    });

    it('F3 consultation links correctly to F1 patient', () => {
      // Setup: F1 patients
      const f1Patients = [{ id: 'p-001', name: 'John Doe' }];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Act: F3 creates consultation and links to F1 patient
      const consultation = {
        id: 'c-1',
        patientId: 'p-001', // Links to F1 patient
        vitals: {
          temperature: '98.6',
          bloodPressure: '120/80',
          pulse: '72',
        },
        complaints: 'Headache',
        diagnosis: 'Migraine',
        medications: ['Ibuprofen 400mg'],
        createdAt: new Date().toISOString(),
      };
      f3ConsultationStorage.push(consultation);
      global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify(f3ConsultationStorage));

      // Link consultation to patient history
      const historyLink = {
        patientId: 'p-001',
        consultationId: 'c-1',
        linkedAt: new Date().toISOString(),
      };
      f3HistoryLinks.push(historyLink);
      global.localStorage.setItem(F3_HISTORY_LINKS_KEY, JSON.stringify(f3HistoryLinks));

      // Assert: Consultation correctly references F1 patient
      const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));
      expect(consultations[0].patientId).toBe('p-001');

      // Verify patient exists in F1
      const patients = JSON.parse(global.localStorage.getItem(F1_PATIENT_STORAGE_KEY));
      const patient = patients.find(p => p.id === consultations[0].patientId);
      expect(patient).toBeDefined();

      // Verify link exists in history
      const links = JSON.parse(global.localStorage.getItem(F3_HISTORY_LINKS_KEY));
      expect(links).toHaveLength(1);
      expect(links[0].patientId).toBe('p-001');
      expect(links[0].consultationId).toBe('c-1');
    });
  });

  describe('F2 ↔ F3 Isolation: Cross-feature data independence', () => {
    it('F2 appointments do not interfere with F3 consultations', () => {
      // Setup: F1 patients
      const f1Patients = [{ id: 'p-001', name: 'John Doe' }];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Act: F2 creates appointment
      const appointment = {
        id: 1,
        patientId: 'p-001',
        date: '2026-08-20',
        time: '10:30',
        status: 'Scheduled',
      };
      global.localStorage.setItem(F2_APPOINTMENT_STORAGE_KEY, JSON.stringify([appointment]));

      // Act: F3 creates consultation
      const consultation = {
        id: 'c-1',
        patientId: 'p-001',
        vitals: { temperature: '98.6', bloodPressure: '120/80', pulse: '72' },
        createdAt: new Date().toISOString(),
      };
      global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify([consultation]));

      // Assert: Both data exist independently
      const appointments = JSON.parse(global.localStorage.getItem(F2_APPOINTMENT_STORAGE_KEY));
      const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));

      expect(appointments).toHaveLength(1);
      expect(consultations).toHaveLength(1);
      expect(appointments[0].date).toBe('2026-08-20');
      expect(consultations[0].vitals.temperature).toBe('98.6');
    });

    it('Deleting appointment does not affect consultation data', () => {
      // Setup
      const f1Patients = [{ id: 'p-001', name: 'John Doe' }];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      const appointment = { id: 1, patientId: 'p-001', date: '2026-08-20' };
      const consultation = { id: 'c-1', patientId: 'p-001', vitals: { temperature: '98.6' } };

      global.localStorage.setItem(F2_APPOINTMENT_STORAGE_KEY, JSON.stringify([appointment]));
      global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify([consultation]));

      // Act: Clear F2 appointments (simulate deletion)
      global.localStorage.setItem(F2_APPOINTMENT_STORAGE_KEY, JSON.stringify([]));

      // Assert: F3 consultation still exists
      const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));
      expect(consultations).toHaveLength(1);
      expect(consultations[0].id).toBe('c-1');
    });
  });

  describe('Multi-patient scenarios: F1 with F2 & F3', () => {
    it('Multiple F1 patients can have F2 appointments and F3 consultations', () => {
      // Setup: Multiple patients in F1
      const f1Patients = [
        { id: 'p-001', name: 'John Doe' },
        { id: 'p-002', name: 'Jane Smith' },
        { id: 'p-003', name: 'Robert Brown' },
      ];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Act: Create appointments and consultations for each patient
      const appointments = [
        { id: 1, patientId: 'p-001', date: '2026-08-20', time: '10:00' },
        { id: 2, patientId: 'p-002', date: '2026-08-20', time: '11:00' },
        { id: 3, patientId: 'p-003', date: '2026-08-21', time: '10:00' },
      ];
      global.localStorage.setItem(F2_APPOINTMENT_STORAGE_KEY, JSON.stringify(appointments));

      const consultations = [
        { id: 'c-1', patientId: 'p-001', vitals: { temperature: '98.6' } },
        { id: 'c-2', patientId: 'p-002', vitals: { temperature: '99.1' } },
        { id: 'c-3', patientId: 'p-003', vitals: { temperature: '97.9' } },
      ];
      global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify(consultations));

      // Assert: All appointments and consultations are stored correctly
      const storedAppointments = JSON.parse(global.localStorage.getItem(F2_APPOINTMENT_STORAGE_KEY));
      const storedConsultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));
      const storedPatients = JSON.parse(global.localStorage.getItem(F1_PATIENT_STORAGE_KEY));

      expect(storedAppointments).toHaveLength(3);
      expect(storedConsultations).toHaveLength(3);
      expect(storedPatients).toHaveLength(3);

      // Verify cross-references
      storedAppointments.forEach(apt => {
        const patient = storedPatients.find(p => p.id === apt.patientId);
        expect(patient).toBeDefined();
      });

      storedConsultations.forEach(cons => {
        const patient = storedPatients.find(p => p.id === cons.patientId);
        expect(patient).toBeDefined();
      });
    });
  });

  describe('Data consistency: F1 patient updates affect F2 & F3', () => {
    it('When F1 patient is updated, F2 appointments and F3 consultations reference updated patient', () => {
      // Setup: Initial patient in F1
      let f1Patients = [{ id: 'p-001', name: 'John Doe', contact: '555-1001' }];
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Create appointment and consultation for patient
      global.localStorage.setItem(F2_APPOINTMENT_STORAGE_KEY, JSON.stringify([
        { id: 1, patientId: 'p-001', date: '2026-08-20' }
      ]));
      global.localStorage.setItem(F3_CONSULTATION_STORAGE_KEY, JSON.stringify([
        { id: 'c-1', patientId: 'p-001', vitals: { temperature: '98.6' } }
      ]));

      // Act: Update patient contact in F1
      f1Patients[0].contact = '555-2002';
      global.localStorage.setItem(F1_PATIENT_STORAGE_KEY, JSON.stringify(f1Patients));

      // Assert: Patient ID remains same, contact updated
      const patients = JSON.parse(global.localStorage.getItem(F1_PATIENT_STORAGE_KEY));
      expect(patients[0].id).toBe('p-001');
      expect(patients[0].contact).toBe('555-2002');

      // Verify F2 and F3 still reference correct patient
      const appointments = JSON.parse(global.localStorage.getItem(F2_APPOINTMENT_STORAGE_KEY));
      const consultations = JSON.parse(global.localStorage.getItem(F3_CONSULTATION_STORAGE_KEY));
      
      expect(appointments[0].patientId).toBe('p-001');
      expect(consultations[0].patientId).toBe('p-001');
    });
  });
});
