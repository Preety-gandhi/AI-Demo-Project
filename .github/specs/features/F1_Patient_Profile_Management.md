# Feature Specification: F1 — Patient Profile Management

## 1. Description
The physician can create, update, and view patient records with core demographic details so each consultation is tied to a complete patient profile.

## 5. Goal
To provide the physician with a simple and reliable way to create, view, and update patient profiles so that each consultation is linked to a complete patient record.

## 6. Non-Goal
This feature does not include receptionist access, billing, insurance processing, multi-doctor workflows, or advanced analytics.

## 7. Current behaviour
Currently, patient information may be managed manually through paper records or fragmented notes, which can lead to incomplete records, slower lookup, and inconsistent consultation workflows.

## 8. Expected behaviour
The system should allow the physician to register a patient, view their profile, and update details quickly from a single web-based interface, ensuring that patient information is accurate, complete, and easily accessible.

## 9. Scope
This feature includes creating, viewing, and updating patient profiles with core demographic details. It covers the patient registration workflow and profile management for the physician during consultations.

## 10. Acceptance Criteria
### Scenario 1: Create patient profile
Given a physician is on the patient registration screen and enters valid patient details
When the form is submitted
Then the form validates required fields and valid details, and the new patient profile is saved and appears in the patient list.


