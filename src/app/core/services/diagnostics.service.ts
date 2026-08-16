import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '@angular/core';
import { API_ENDPOINTS } from '../api.config';
import { DiagnosisSearchResult } from '../models';

/**
 * DiagnosticsService — proxy to CIE-11 / ICD-11 local API
 */
@Service()
export class DiagnosticsService {
  private readonly http = inject(HttpClient);

  /**
   * Standard search against the CIE-11 API.
   * @param query Search term (min 2 chars)
   */
  search(query: string): Observable<DiagnosisSearchResult[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<DiagnosisSearchResult[]>(API_ENDPOINTS.diagnostics.search, { params });
  }

  /**
   * Flexible/fuzzy search with typo tolerance.
   * @param query Approximate search term (min 2 chars)
   */
  searchFlexible(query: string): Observable<DiagnosisSearchResult[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<DiagnosisSearchResult[]>(API_ENDPOINTS.diagnostics.flexible, { params });
  }
}
