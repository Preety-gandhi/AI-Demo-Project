# AGENTS.md — Patient Management Application

## Project Overview

This project is a web-based Patient Management Application for a general physician. It is designed to simplify daily clinical workflow by supporting patient registration, appointment scheduling, consultation notes, prescription generation, search, and data export.

Primary goal: reduce paperwork, improve consultation speed, and keep patient history accessible and structured.

## Product Context

- Primary user: General Physician
- Scope for Phase 1: single-user clinic workflow
- Core value: fast and reliable patient record management during consultations
- Important constraint: keep the product simple, lightweight, and optimized for speed

## Key Modules

### 1. Patient Management
- Add, edit, and view patient profiles
- Store core details such as name, age/DOB, gender, and contact information
- Support patient search by name or phone number

### 2. Appointment Management
- Schedule appointments
- View daily appointment list
- Update status: Scheduled, Completed, Cancelled, No-show

### 3. Consultation Workflow
- Capture mandatory vitals: temperature, blood pressure, pulse
- Record symptoms/complaints
- Record diagnosis notes
- Add medications with dosage, frequency, duration, and instructions

### 4. Prescription Management
- Generate printable prescriptions
- Include clinic/doctor header, patient details, vitals, diagnosis, medications, and footer/signature area

### 5. Patient History and Search
- View previous visits by patient
- Access vitals, complaints, diagnosis, and prescriptions
- Filter visit history by date
- Provide quick navigation between profile and visits

### 6. Data Export
- Export patient or visit data as CSV and PDF

## Product Principles

- Prioritize usability for fast consultation entry
- Keep the interface simple and minimal
- Ensure patient records are easy to retrieve and review
- Maintain data integrity and avoid data loss
- Do not introduce complexity that is outside Phase 1 scope

## Implementation Guidance

- Build a browser-based web application that works well in modern browsers
- Keep workflows optimized for a single doctor using the system during consultation
- Prefer straightforward CRUD flows with clear forms and search
- Ensure prescription generation and export features are reliable and printable
- Keep navigation fast and intuitive between patient profile, appointments, and visit history

## Data and Privacy Expectations

- Treat all patient data as sensitive medical information
- Implement secure authentication for the single-user workflow
- Protect data in transit and at rest
- Avoid exposing unnecessary patient information in logs or UI states
- Follow secure coding practices for storage and access

## Team Conventions

- Use clear naming for patient, visit, appointment, and prescription entities
- Keep business logic separated from UI where practical
- Prefer reusable components for forms, patient cards, search, and history views
- Maintain consistency in labeling and status values
- Avoid introducing multi-user, billing, insurance, lab integration, or AI diagnostics features in Phase 1

## Testing Expectations

- Validate core user journeys:
  - Register patient
  - Schedule appointment
  - Record consultation with vitals
  - Generate prescription
  - Search patient history
  - Export CSV/PDF
- Test for data persistence and printable output
- Verify search and history retrieval remain fast and accurate

## Guardrails

- Do not add features outside the Phase 1 scope unless explicitly requested
- Do not introduce receptionist, multi-user, billing, insurance, or lab integration flows
- Do not hardcode secrets or sensitive configuration
- Do not break prescription printing or export functionality while making UI changes
- Do not remove mandatory vitals capture from consultation workflow

## Common Workflows

### Add a New Patient
1. Open patient registration flow
2. Enter patient details
3. Save patient profile
4. Confirm the record is searchable

## Specialized Subagents

The following subagents can be used for delivery work on this project:

- Research Agent: understand the problem, map the codebase, and identify risks.
- Implementation Agent: write code only, following the approved plan and specification.
- Test Agent: write and run tests against the implementation and report results.
- Review Agent: compare the implementation against the spec and flag non-conformances.
- Security Agent: scan for secrets, injection risks, and insecure dependencies.

Each subagent should receive the context described in its dedicated markdown file under the agents folder.

### Schedule an Appointment
1. Create appointment entry
2. Assign patient and date/time
3. Save status as Scheduled
4. Update later when completed or cancelled

### Record a Consultation
1. Open patient record
2. Capture vitals
3. Enter complaints and diagnosis
4. Add medications and prescription details
5. Save consultation history

### Generate Prescription
1. Review consultation details
2. Generate printable prescription
3. Confirm header, patient details, diagnosis, medications, and footer are present

## Decision Log

- 2026-07-28: Defined Phase 1 scope around a single-doctor clinic workflow
- 2026-07-28: Confirmed mandatory vitals capture for every consultation
- 2026-07-28: Prioritized simple appointment, consultation, and prescription flows over advanced features
