// ─────────────────────────────────────────────────────────────────────────────
// Clinical Record Models — Admissions, Evolutions, Discharges
// ─────────────────────────────────────────────────────────────────────────────

import { Diagnosis } from './diagnosis.model';
import { Patient } from './patient.model';

// Embedded user info returned by several endpoints
export interface EmbeddedUser {
  description: string;
}

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
  patient: Patient;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  user?: EmbeddedUser;
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
  date?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  user?: EmbeddedUser;
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
  admission?: Admission;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  user?: EmbeddedUser;
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
