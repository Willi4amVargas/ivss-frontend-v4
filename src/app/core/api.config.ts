// ─────────────────────────────────────────────────────────────────────────────
// API Configuration — Central API base URL
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = 'http://192.168.0.108:3000/api/v1';

export const API_ENDPOINTS = {
  health: '/',

  // Patients
  patients: {
    base: `${API_BASE_URL}/patients`,
    byId: (id: string) => `${API_BASE_URL}/patients/${id}`,
    byCedula: (cedula: string) => `${API_BASE_URL}/patients/cedula/${cedula}`,
    searchByCedula: (cedula: string) => `${API_BASE_URL}/patients/cedula/search/${cedula}`,
    byHistory: (historia: string) => `${API_BASE_URL}/patients/history/${historia}`,
    searchByHistory: (historia: string) => `${API_BASE_URL}/patients/history/search/${historia}`,
    deleteHistory: (id: string, history: string) => `${API_BASE_URL}/patients/history/${id}/${history}`,
  },

  // Clinical Records
  admissions: {
    base: `${API_BASE_URL}/clinical-records/admissions`,
    byId: (id: string) => `${API_BASE_URL}/clinical-records/admissions/${id}`,
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
  },

  // Diagnostics (CIE-11 proxy)
  diagnostics: {
    search: `${API_BASE_URL}/diagnostics/search`,
    flexible: `${API_BASE_URL}/diagnostics/search/flexible`,
  },
} as const;
