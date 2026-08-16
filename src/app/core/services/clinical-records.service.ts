import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '@angular/core';
import { API_ENDPOINTS } from '../api.config';
import {
  Admission, CreateAdmissionDto, UpdateAdmissionDto,
  Evolution, CreateEvolutionDto, UpdateEvolutionDto,
  Discharge, CreateDischargeDto, UpdateDischargeDto,
} from '../models';

// ── Admissions ────────────────────────────────────────────────────────────────

/**
 * AdmissionsService — CRUD for hospital admissions/ingresos
 */
@Service()
export class AdmissionsService {
  private readonly http = inject(HttpClient);

  /** GET /clinical-records/admissions */
  getAll(): Observable<Admission[]> {
    return this.http.get<Admission[]>(API_ENDPOINTS.admissions.base);
  }

  /** GET /clinical-records/admissions/:id */
  getById(id: string): Observable<Admission> {
    return this.http.get<Admission>(API_ENDPOINTS.admissions.byId(id));
  }

  /** POST /clinical-records/admissions */
  create(dto: CreateAdmissionDto): Observable<Admission> {
    return this.http.post<Admission>(API_ENDPOINTS.admissions.base, dto);
  }

  /** PATCH /clinical-records/admissions/:id */
  update(id: string, dto: UpdateAdmissionDto): Observable<Admission> {
    return this.http.patch<Admission>(API_ENDPOINTS.admissions.byId(id), dto);
  }

  /** DELETE /clinical-records/admissions/:id */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.admissions.byId(id));
  }
}

// ── Evolutions ────────────────────────────────────────────────────────────────

/**
 * EvolutionsService — CRUD for hospital evolution notes
 */
@Service()
export class EvolutionsService {
  private readonly http = inject(HttpClient);

  /** GET /clinical-records/evolutions/admissions/:admissionId */
  getByAdmission(admissionId: string): Observable<Evolution[]> {
    return this.http.get<Evolution[]>(API_ENDPOINTS.evolutions.byAdmission(admissionId));
  }

  /** GET /clinical-records/evolutions/:id */
  getById(id: string): Observable<Evolution> {
    return this.http.get<Evolution>(API_ENDPOINTS.evolutions.byId(id));
  }

  /** POST /clinical-records/evolutions */
  create(dto: CreateEvolutionDto): Observable<Evolution> {
    return this.http.post<Evolution>(API_ENDPOINTS.evolutions.base, dto);
  }

  /** PATCH /clinical-records/evolutions/:id */
  update(id: string, dto: UpdateEvolutionDto): Observable<Evolution> {
    return this.http.patch<Evolution>(API_ENDPOINTS.evolutions.byId(id), dto);
  }

  /** DELETE /clinical-records/evolutions/:id */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.evolutions.byId(id));
  }
}

// ── Discharges ────────────────────────────────────────────────────────────────

/**
 * DischargesService — CRUD for hospital discharges/egresos
 */
@Service()
export class DischargesService {
  private readonly http = inject(HttpClient);

  /** GET /clinical-records/discharges */
  getAll(): Observable<Discharge[]> {
    return this.http.get<Discharge[]>(API_ENDPOINTS.discharges.base);
  }

  /** GET /clinical-records/discharges/:id */
  getById(id: string): Observable<Discharge> {
    return this.http.get<Discharge>(API_ENDPOINTS.discharges.byId(id));
  }

  /** POST /clinical-records/discharges */
  create(dto: CreateDischargeDto): Observable<Discharge> {
    return this.http.post<Discharge>(API_ENDPOINTS.discharges.base, dto);
  }

  /** PATCH /clinical-records/discharges/:id */
  update(id: string, dto: UpdateDischargeDto): Observable<Discharge> {
    return this.http.patch<Discharge>(API_ENDPOINTS.discharges.byId(id), dto);
  }

  /** DELETE /clinical-records/discharges/:id */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.discharges.byId(id));
  }
}
