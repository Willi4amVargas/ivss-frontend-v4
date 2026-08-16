import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { AdmissionsService } from '../../../core/services/clinical-records.service';
import { Admission } from '../../../core/models';

@Component({
  selector: 'app-admissions-list',
  imports: [RouterLink, DatePipe, SlicePipe],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Admisiones</h1>
          <p class="mt-1 text-sm text-slate-500">Registro de admisiones hospitalarias</p>
        </div>
        <a
          routerLink="/admissions/new"
          class="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#16304f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
          aria-label="Crear nueva admisión"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Admisión
        </a>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div
          class="flex flex-col items-center justify-center py-24 text-slate-500"
          role="status"
          aria-live="polite"
        >
          <svg
            class="mb-4 h-10 w-10 animate-spin text-[#1e3a5f]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p class="text-sm font-medium">Cargando admisiones…</p>
        </div>
      }

      <!-- Error State -->
      @if (!isLoading() && errorMsg()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mx-auto mb-3 h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v4m0 4h.01M10.293 4.293a1 1 0 011.414 0l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414l7-7z"
            />
          </svg>
          <p class="text-sm font-semibold text-red-700">Error al cargar las admisiones</p>
          <p class="mt-1 text-xs text-red-600">{{ errorMsg() }}</p>
          <button
            (click)="loadAdmissions()"
            class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && !errorMsg() && admissions().length === 0) {
        <div
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-24 text-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mb-4 h-12 w-12 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12h6m-3-3v6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1z"
            />
          </svg>
          <p class="text-base font-semibold text-slate-600">No hay admisiones registradas</p>
          <p class="mt-1 text-sm text-slate-400">Crea la primera admisión para comenzar.</p>
          <a
            routerLink="/admissions/new"
            class="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Admisión
          </a>
        </div>
      }

      <!-- Admissions Table -->
      @if (!isLoading() && !errorMsg() && admissions().length > 0) {
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm" aria-label="Lista de admisiones">
              <thead>
                <tr
                  class="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <th scope="col" class="px-5 py-3.5">Paciente ID</th>
                  <th scope="col" class="px-5 py-3.5">Fecha de Admisión</th>
                  <th scope="col" class="px-5 py-3.5">Motivo de Consulta</th>
                  <th scope="col" class="px-5 py-3.5 text-center">Diagnósticos</th>
                  <th scope="col" class="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (admission of admissions(); track admission.id) {
                  <tr class="group transition hover:bg-slate-50">
                    <!-- Patient ID -->
                    <td class="px-5 py-4">
                      <span
                        class="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3.5 w-3.5 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {{ admission.patient_id | slice: 0 : 8 }}…
                      </span>
                    </td>

                    <!-- Admission Date -->
                    <td class="px-5 py-4 text-slate-700">
                      @if (admission.admission_date) {
                        <span class="inline-flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3.5 w-3.5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {{ admission.admission_date | date: 'dd/MM/yyyy' }}
                        </span>
                      } @else {
                        <span class="italic text-slate-400">Sin fecha</span>
                      }
                    </td>

                    <!-- Consult Reason (first item) -->
                    <td class="max-w-xs px-5 py-4">
                      @if (admission.consult_reason.length > 0) {
                        <p class="truncate text-slate-700">{{ admission.consult_reason[0] }}</p>
                        @if (admission.consult_reason.length > 1) {
                          <span class="text-xs text-slate-400"
                            >+{{ admission.consult_reason.length - 1 }} más</span
                          >
                        }
                      } @else {
                        <span class="italic text-slate-400">—</span>
                      }
                    </td>

                    <!-- Diagnoses count -->
                    <td class="px-5 py-4 text-center">
                      <span
                        class="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        [class.bg-emerald-100]="admission.admission_diagnosis.length > 0"
                        [class.text-emerald-800]="admission.admission_diagnosis.length > 0"
                        [class.bg-slate-100]="admission.admission_diagnosis.length === 0"
                        [class.text-slate-500]="admission.admission_diagnosis.length === 0"
                        [attr.aria-label]="admission.admission_diagnosis.length + ' diagnósticos'"
                      >
                        {{ admission.admission_diagnosis.length }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-5 py-4">
                      <div class="flex items-center justify-end gap-1">
                        <!-- View -->
                        <a
                          [routerLink]="['/admissions', admission.id]"
                          class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1e3a5f] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                          [attr.aria-label]="'Ver detalle de admisión ' + admission.id"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver
                        </a>

                        <!-- Edit -->
                        <a
                          [routerLink]="['/admissions', admission.id, 'edit']"
                          class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          [attr.aria-label]="'Editar admisión ' + admission.id"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Editar
                        </a>

                        <!-- Delete -->
                        <button
                          (click)="confirmDelete(admission)"
                          class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                          [attr.aria-label]="'Eliminar admisión ' + admission.id"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Table footer with count -->
          <div class="border-t border-slate-100 bg-slate-50 px-5 py-3">
            <p class="text-xs text-slate-500">
              {{ admissions().length }} admisión{{ admissions().length !== 1 ? 'es' : '' }} en total
            </p>
          </div>
        </div>
      }

      <!-- Delete Confirmation Dialog -->
      @if (deletingAdmission()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div class="mb-4 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v4m0 4h.01M10.293 4.293a1 1 0 011.414 0l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414l7-7z"
                  />
                </svg>
              </div>
              <h2 id="delete-dialog-title" class="text-base font-semibold text-slate-800">
                Confirmar eliminación
              </h2>
            </div>
            <p class="text-sm text-slate-600">
              ¿Deseas eliminar esta admisión? Esta acción no se puede deshacer.
            </p>
            <div class="mt-6 flex justify-end gap-3">
              <button
                (click)="deletingAdmission.set(null)"
                [disabled]="isDeleting()"
                class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Cancelar
              </button>
              <button
                (click)="deleteAdmission()"
                [disabled]="isDeleting()"
                class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                @if (isDeleting()) {
                  <svg
                    class="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Eliminando…
                } @else {
                  Eliminar
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdmissionsListComponent implements OnInit {
  private readonly admissionsService = inject(AdmissionsService);

  readonly admissions = signal<Admission[]>([]);
  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly deletingAdmission = signal<Admission | null>(null);
  readonly isDeleting = signal(false);

  ngOnInit(): void {
    this.loadAdmissions();
  }

  loadAdmissions(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.admissionsService.getAll().subscribe({
      next: (list) => {
        this.admissions.set(list);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMsg.set(err?.message ?? 'Error desconocido');
        this.isLoading.set(false);
      },
    });
  }

  confirmDelete(admission: Admission): void {
    this.deletingAdmission.set(admission);
  }

  deleteAdmission(): void {
    const target = this.deletingAdmission();
    if (!target) return;

    this.isDeleting.set(true);

    this.admissionsService.delete(target.id).subscribe({
      next: () => {
        this.admissions.update((list) => list.filter((a) => a.id !== target.id));
        this.deletingAdmission.set(null);
        this.isDeleting.set(false);
      },
      error: (err: Error) => {
        this.errorMsg.set(err?.message ?? 'Error al eliminar');
        this.deletingAdmission.set(null);
        this.isDeleting.set(false);
      },
    });
  }
}
