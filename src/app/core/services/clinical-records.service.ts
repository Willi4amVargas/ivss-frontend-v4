import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '@angular/core';
import { API_ENDPOINTS } from '../api.config';
import {
  Admission,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  Evolution,
  CreateEvolutionDto,
  UpdateEvolutionDto,
  Discharge,
  CreateDischargeDto,
  UpdateDischargeDto,
  PaginatedResponse,
  PaginationQueryParams,
} from '../models';

export interface AdmissionQueryParams extends PaginationQueryParams {
  status?: 'active';
  byUser?: 'active';
}

// ── Admissions ────────────────────────────────────────────────────────────────

/**
 * AdmissionsService — CRUD for hospital admissions/ingresos
 */
@Service()
export class AdmissionsService {
  private readonly http = inject(HttpClient);

  /** GET /clinical-records/admissions */
  getAll(params?: AdmissionQueryParams): Observable<PaginatedResponse<Admission>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.byUser) httpParams = httpParams.set('byUser', params.byUser);

    return this.http.get<PaginatedResponse<Admission>>(API_ENDPOINTS.admissions.base, {
      params: httpParams,
    });
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

  /** DELETE /clinical-records/admissions/diagnoses/:id */
  deleteDiagnose(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.admissions.byDiagnoses(id));
  }

  /** GET /clinical-records/admissions/:id/document */
  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.admissions.document(id), { responseType: 'blob' });
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
  update(
    id: string,
    dto: UpdateEvolutionDto,
  ): Observable<{ generatedMaps: string[]; raw: string[]; affected: number }> {
    return this.http.patch<{ generatedMaps: string[]; raw: string[]; affected: number }>(
      API_ENDPOINTS.evolutions.byId(id),
      dto,
    );
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
  getAll(params?: PaginationQueryParams): Observable<PaginatedResponse<Discharge>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);

    return this.http.get<PaginatedResponse<Discharge>>(API_ENDPOINTS.discharges.base, {
      params: httpParams,
    });
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

  /** DELETE /clinical-records/discharges/diagnoses/:id */
  deleteDiagnose(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.discharges.byDiagnoses(id));
  }

  /** GET /clinical-records/discharges/:id/document */
  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.discharges.document(id), { responseType: 'blob' });
  }
}
