import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, throwError, takeUntil } from 'rxjs';
import { API_ENDPOINTS } from '../api.config';
import { AuthUser, SigninResponse, RecoveryResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Current authenticated user
  readonly currentUser = signal<AuthUser | null>(null);

  // Loading state for initial auth check
  readonly isInitializing = signal<boolean>(true);

  constructor() {
    this.checkInitialAuth();
  }

  private checkInitialAuth(): void {
    if (this.getToken()) {
      this.fetchMe().subscribe({
        next: () => this.isInitializing.set(false),
        error: () => {
          this.logout();
          this.isInitializing.set(false);
        },
      });
    } else {
      this.isInitializing.set(false);
    }
  }

  // Get token from local storage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Set token to local storage
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Remove token
  removeToken(): void {
    localStorage.removeItem('token');
  }

  // 1. Signin
  signin(credentials: any): Observable<SigninResponse> {
    return this.http.post<SigninResponse>(API_ENDPOINTS.auth.signin, credentials).pipe(
      tap((res) => {
        if (res.access_token) {
          this.setToken(res.access_token);
        }
      }),
    );
  }

  // 2. Signup
  signup(data: any): Observable<AuthUser> {
    return this.http.post<AuthUser>(API_ENDPOINTS.auth.signup, data);
  }

  // 3. Me
  fetchMe(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(API_ENDPOINTS.auth.me)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  // 4. Request Recovery
  requestRecovery(username: string): Observable<RecoveryResponse> {
    return this.http.post<RecoveryResponse>(API_ENDPOINTS.auth.recovery, { username });
  }

  // 5. Submit Recovery
  submitRecovery(data: any): Observable<RecoveryResponse> {
    return this.http.put<RecoveryResponse>(API_ENDPOINTS.auth.recovery, data);
  }

  // Logout
  logout(): void {
    this.removeToken();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
