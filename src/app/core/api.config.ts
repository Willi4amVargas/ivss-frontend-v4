// ─────────────────────────────────────────────────────────────────────────────
// API Configuration — Central API base URL
// ─────────────────────────────────────────────────────────────────────────────

import { environment } from "../../environments/environment";

export const API_BASE_URL = environment.API_BASE_URL

export const API_ENDPOINTS = {
  health: '/',

  // Patients
  patients: {
    base: `${API_BASE_URL}/patients`,
    byId: (id: string) => `${API_BASE_URL}/patients/${id}`,
    search: `${API_BASE_URL}/patients/search`,
    deleteHistory: (id: string, history: string) => `${API_BASE_URL}/patients/history/${id}/${history}`,
  },

  // Clinical Records
  admissions: {
    base: `${API_BASE_URL}/clinical-records/admissions`,
    byId: (id: string) => `${API_BASE_URL}/clinical-records/admissions/${id}`,    
    byDiagnoses: (id:string)=> `${API_BASE_URL}/clinical-records/admissions/diagnoses/${id}`
  },

  evolutions: {
    base: `${API_BASE_URL}/clinical-records/evolutions`,
    byId: (id: string) => `${API_BASE_URL}/clinical-records/evolutions/${id}`,
    byAdmission: (admissionId: string) =>
      `${API_BASE_URL}/clinical-records/evolutions/admissions/${admissionId}`,
  },

  discharges: {
    base: `${API_BASE_URL}/clinical-records/discharges`,
    byId: (id: string) => `${API_BASE_URL}/clinical-records/discharges/${id}`,
    byDiagnoses: (id: string) => `${API_BASE_URL}/clinical-records/discharges/diagnoses/${id}`,
  },

  // Diagnostics (CIE-11 proxy)
  diagnostics: {
    search: `${API_BASE_URL}/diagnostics/search`,
    flexible: `${API_BASE_URL}/diagnostics/search/flexible`,
  },
} as const;
