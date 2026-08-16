// ─────────────────────────────────────────────────────────────────────────────
// Patient Models — Hospital Dr. Patrocinio Peñuela Ruíz
// ─────────────────────────────────────────────────────────────────────────────

import { Admission } from "./clinical-record.model";

export type Gender = 'M' | 'F';

export interface Patient {
  id: string;
  document_id: string;
  history_numbers: string[];
  names: string;
  lastnames: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  gender: Gender;
  address: string;
  status: boolean;
  admissions?: Admission[];
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreatePatientDto {
  document_id: string;
  history_numbers?: string[];
  names: string;
  lastnames: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  gender: Gender;
  address: string;
  status?: boolean;
}

export type UpdatePatientDto = Partial<CreatePatientDto>;
