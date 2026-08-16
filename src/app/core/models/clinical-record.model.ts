// ─────────────────────────────────────────────────────────────────────────────
// Clinical Record Models — Admissions, Evolutions, Discharges
// ─────────────────────────────────────────────────────────────────────────────

import { Diagnosis } from './diagnosis.model';

// ── Admission ─────────────────────────────────────────────────────────────────

export interface Admission {
  id: string;
  patient_id: string;
  admission_date?: string;
  consult_reason: string[];
  current_condition: string;
  background: string[];
  admission_exam: string;
  admission_diagnosis: Diagnosis[];
  evolutions?: Evolution[];
  discharge?: Discharge;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAdmissionDto {
  patient_id: string;
  admission_date?: string;
  consult_reason: string[];
  current_condition: string;
  background: string[];
  admission_exam: string;
  diagnoses: Diagnosis[];
}

export type UpdateAdmissionDto = Partial<CreateAdmissionDto>;

// ── Evolution ─────────────────────────────────────────────────────────────────

export interface Evolution {
  id: string;
  admission_id: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEvolutionDto {
  admission_id: string;
  description: string;
}

export interface UpdateEvolutionDto {
  description: string;
}

// ── Discharge ─────────────────────────────────────────────────────────────────

export interface Discharge {
  id: string;
  admission_id: string;
  discharge_date?: string;
  discharge_exam: string;
  morbility_status?: boolean;
  treatment_plan?: string;
  discharges_diagnosis: Diagnosis[];
}

export interface CreateDischargeDto {
  admission_id: string;
  discharge_date?: string;
  discharge_exam: string;
  morbility_status?: boolean;
  treatment_plan?: string;
  diagnoses: Diagnosis[];
}

export type UpdateDischargeDto = Partial<CreateDischargeDto>;
