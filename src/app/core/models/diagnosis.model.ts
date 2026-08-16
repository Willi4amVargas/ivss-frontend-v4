// ─────────────────────────────────────────────────────────────────────────────
// Diagnosis Models — CIE-11 / ICD-11
// ─────────────────────────────────────────────────────────────────────────────

export interface DiagnosisSearchResult {
  code: string;
  title: string;
}

export interface Diagnosis {
  /** Present when updating an existing diagnosis */
  id?: string;
  code: string;
  title: string;
  description?: string;
}
