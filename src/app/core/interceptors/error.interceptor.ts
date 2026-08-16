import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

/**
 * Global HTTP error interceptor.
 * Normalizes NestJS error responses into a consistent ApiError shape.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError: ApiError = {
        status: error.status,
        message: resolveMessage(error),
        detail: error.error?.message ?? error.message,
      };
      return throwError(() => apiError);
    }),
  );
};

function resolveMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 0:
      return 'No se pudo conectar con el servidor. Verifique su conexión.';
    case 400:
      return 'Datos inválidos. Verifique el formulario.';
    case 404:
      return 'El recurso solicitado no fue encontrado.';
    case 409:
      return 'Conflicto: ' + (error.error?.message ?? 'operación no permitida.');
    case 500:
      return 'Error interno del servidor. Intente más tarde.';
    default:
      return `Error inesperado (${error.status}).`;
  }
}
