import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '@angular/core';
import { API_ENDPOINTS } from '../api.config';
import { Patient, CreatePatientDto, UpdatePatientDto, PaginatedResponse, PaginationQueryParams } from '../models';

export interface PatientSearchQueryParams extends PaginationQueryParams {
  q: string;
  type: 'document_id' | 'name' | 'history_number';
}

/**
 * PatientsService — CRUD operations for patient management
 */
@Service()
export class PatientsService {
  private readonly http = inject(HttpClient);

  /** GET /patients — List all patients ordered alphabetically (Paginated) */
  getAll(params?: PaginationQueryParams): Observable<PaginatedResponse<Patient>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    
    return this.http.get<PaginatedResponse<Patient>>(API_ENDPOINTS.patients.base, { params: httpParams });
  }

  /** GET /patients/search — Search patients by document_id, name, or history_number (Paginated) */
  search(params: PatientSearchQueryParams): Observable<PaginatedResponse<Patient>> {
    let httpParams = new HttpParams()
      .set('q', params.q)
      .set('type', params.type);
      
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    
    return this.http.get<PaginatedResponse<Patient>>(API_ENDPOINTS.patients.search, { params: httpParams });
  }

  /** GET /patients/:id — Get patient by internal UUID (includes clinical records) */
  getById(id: string): Observable<Patient> {
    return this.http.get<Patient>(API_ENDPOINTS.patients.byId(id));
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
