import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '@angular/core';
import { API_ENDPOINTS } from '../api.config';
import { Patient, CreatePatientDto, UpdatePatientDto } from '../models';

/**
 * PatientsService — CRUD operations for patient management
 */
@Service()
export class PatientsService {
  private readonly http = inject(HttpClient);

  /** GET /patients — List all patients ordered alphabetically */
  getAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(API_ENDPOINTS.patients.base);
  }

  /** GET /patients/:id — Get patient by internal UUID (includes clinical records) */
  getById(id: string): Observable<Patient> {
    return this.http.get<Patient>(API_ENDPOINTS.patients.byId(id));
  }

  /** GET /patients/cedula/:cedula — Exact match by document ID */
  getByCedula(cedula: string): Observable<Patient> {
    return this.http.get<Patient>(API_ENDPOINTS.patients.byCedula(cedula));
  }

  /** GET /patients/cedula/search/:cedula — Partial match by document ID */
  searchByCedula(cedula: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(API_ENDPOINTS.patients.searchByCedula(cedula));
  }

  /** GET /patients/history/:historia — Exact match by history number */
  getByHistory(historia: string): Observable<Patient> {
    return this.http.get<Patient>(API_ENDPOINTS.patients.byHistory(historia));
  }

  /** GET /patients/history/search/:historia — Partial match by history number */
  searchByHistory(historia: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(API_ENDPOINTS.patients.searchByHistory(historia));
  }

  /** POST /patients — Register a new patient */
  create(dto: CreatePatientDto): Observable<Patient> {
    return this.http.post<Patient>(API_ENDPOINTS.patients.base, dto);
  }

  /** PATCH /patients/:id — Update patient data */
  update(id: string, dto: UpdatePatientDto): Observable<Patient> {
    return this.http.patch<Patient>(API_ENDPOINTS.patients.byId(id), dto);
  }

  /** DELETE /patients/:id — Delete a patient (fails if has clinical records) */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.patients.byId(id));
  }

  /** DELETE /patients/history/:id/:history — Remove a specific history number */
  deleteHistoryNumber(id: string, history: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.patients.deleteHistory(id, history));
  }
}
