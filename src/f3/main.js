import { createConsultationRecordApp } from "./consultationRecordApp.js";

const mount = document.getElementById("app");

// Debug: Check localStorage availability
console.log("📍 F3 App Loading...");
console.log("🔍 localStorage available:", typeof window !== 'undefined' && !!window.localStorage);
console.log("📦 Existing localStorage keys:", window.localStorage ? Object.keys(window.localStorage) : 'N/A');

createConsultationRecordApp({ mount });

// Debug: Log storage after initialization
console.log("📝 After F3 init - localStorage keys:", Object.keys(window.localStorage));
console.log("✅ F3 App Initialized");
