import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
import { catchError } from 'rxjs';
// import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Automatically logout if unauthorized
        // authService.logout();
        localStorage.removeItem('token');
      }
      throw error;
    }),
  );
};
