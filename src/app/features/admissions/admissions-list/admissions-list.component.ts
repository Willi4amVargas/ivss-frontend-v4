import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AdmissionsService } from '../../../core/services/clinical-records.service';
import { Admission, PaginatedMeta } from '../../../core/models';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admissions-list',
  imports: [RouterLink, DatePipe, TitleCasePipe],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 flex flex-col">
      <!-- Page Header -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

      <!-- Filters -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <!-- Status Filter -->
        <div class="w-full sm:w-48">
          <label for="status-filter" class="sr-only">Estado de la admisión</label>
          <select
            id="status-filter"
            [value]="filterStatus()"
            (change)="onStatusChange($event)"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="active">Solo Activas</option>
            <option value="all">Todas</option>
          </select>
        </div>

        <!-- Date Filter (Local) -->
        <div class="w-full sm:w-48">
          <label for="date-filter" class="sr-only">Filtrar por fecha</label>
          <input
            type="date"
            id="date-filter"
            [value]="filterDate()"
            (input)="onDateChange($event)"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        @if (filterDate()) {
          <button
            (click)="clearDate()"
            class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Limpiar Fecha
          </button>
        }
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
      @if (!isLoading() && !errorMsg() && filteredAdmissions().length === 0) {
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
          <p class="text-base font-semibold text-slate-600">No se encontraron admisiones</p>
          <p class="mt-1 text-sm text-slate-400">Intenta cambiar los filtros o crea una nueva.</p>
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
      @if (!isLoading() && !errorMsg() && filteredAdmissions().length > 0) {
        <div
          class="overflow-hidden flex flex-col flex-1 rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left text-sm" aria-label="Lista de admisiones">
              <thead>
                <tr
                  class="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <th scope="col" class="px-5 py-3.5">Paciente</th>
                  <th scope="col" class="px-5 py-3.5">Fecha de Admisión</th>
                  <th scope="col" class="px-5 py-3.5">Motivo de Consulta</th>

                  @if (filterStatus() === 'all') {
                    <th scope="col" class="px-5 py-3.5">Egreso</th>
                  }

                  <th scope="col" class="px-5 py-3.5 text-center">Diagnósticos</th>
                  <th scope="col" class="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (admission of filteredAdmissions(); track admission.id) {
                  <tr class="group transition hover:bg-slate-50">
                    <!-- Patient -->
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"
                        >
                          <svg
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div class="flex flex-col">
                          <span class="text-sm font-semibold text-slate-800">
                            {{ admission.patient.names | titlecase }}
                            {{ admission.patient.lastnames | titlecase }}
                          </span>
                          <span class="text-xs text-slate-500 font-mono mt-0.5">
                            CI: {{ admission.patient.document_id }}
                          </span>
                        </div>
                      </div>
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
                          {{ admission.admission_date | date: 'dd/MM/yyyy, HH:mm' }}
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

                    <!-- Discharge Badge (Conditional) -->
                    @if (filterStatus() === 'all') {
                      <td class="px-5 py-4">
                        @if (admission.discharge) {
                          <a
                            [routerLink]="['/discharges', admission.discharge.id]"
                            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors"
                            aria-label="Ver alta médica"
                          >
                            <span
                              class="h-1.5 w-1.5 rounded-full bg-emerald-500"
                              aria-hidden="true"
                            ></span>
                            Alta Médica
                          </a>
                        } @else {
                          <span
                            class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
                          >
                            <span
                              class="h-1.5 w-1.5 rounded-full bg-blue-500"
                              aria-hidden="true"
                            ></span>
                            En Hospitalización
                          </span>
                        }
                      </td>
                    }

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

          <!-- Pagination Footer -->
          @if (meta() && meta()!.total_items > 0) {
            <div
              class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-3 mt-auto"
            >
              <p class="text-xs text-slate-500 text-center sm:text-left">
                Mostrando página <span class="font-medium text-slate-700">{{ meta()!.page }}</span> de
                <span class="font-medium text-slate-700">{{ meta()!.total_pages }}</span>
                (<span class="font-medium text-slate-700">{{ meta()!.total_items }}</span> resultados)
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="prevPage()"
                  [disabled]="meta()!.page <= 1"
                  class="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  (click)="nextPage()"
                  [disabled]="meta()!.page >= meta()!.total_pages"
                  class="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
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
  readonly meta = signal<PaginatedMeta | null>(null);
  
  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  // Filters
  readonly filterStatus = signal<'active' | 'all'>('active');
  readonly filterDate = signal<string>('');

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly deletingAdmission = signal<Admission | null>(null);
  readonly isDeleting = signal(false);

  readonly filteredAdmissions = computed(() => {
    let list = this.admissions();
    const dateQuery = this.filterDate();

    if (dateQuery) {
      list = list.filter((a) => {
        if (!a.admission_date) return false;
        // admission_date is typically in ISO format "2026-03-30T..."
        return a.admission_date.startsWith(dateQuery);
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.loadAdmissions();
  }

  loadAdmissions(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const statusParam = this.filterStatus() === 'active' ? 'active' : undefined;

    this.admissionsService.getAll({ 
      page: this.currentPage(), 
      limit: this.pageSize(),
      status: statusParam
    }).subscribe({
      next: (response) => {
        this.admissions.set(response.data);
        this.meta.set(response.meta);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMsg.set(err?.message ?? 'Error desconocido');
        this.isLoading.set(false);
      },
    });
  }

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as 'active' | 'all';
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadAdmissions(); // Re-fetch from API
  }

  onDateChange(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    this.filterDate.set(date);
    // Note: Local date filtering on paginated result. To truly filter by date, the backend must support it.
  }

  clearDate(): void {
    this.filterDate.set('');
  }

  // Pagination Actions
  prevPage() {
    if (this.meta() && this.meta()!.page > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadAdmissions();
    }
  }

  nextPage() {
    if (this.meta() && this.meta()!.page < this.meta()!.total_pages) {
      this.currentPage.update((p) => p + 1);
      this.loadAdmissions();
    }
  }

  confirmDelete(admission: Admission): void {
    this.deletingAdmission.set(admission);
  }

  deleteAdmission(): void {
    const target = this.deletingAdmission();
    if (!target) return;

    this.isDeleting.set(true);

    this.admissionsService
      .delete(target.id)
      .pipe(
        finalize(() => {
          this.deletingAdmission.set(null);
          this.isDeleting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.loadAdmissions(); // Refresh the list after deleting
        },
        error: (err: Error) => {
          this.errorMsg.set(err?.message ?? 'Error al eliminar');
        },
      });
  }
}
