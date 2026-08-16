import { Component, OnInit, inject, signal, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PatientsService } from '../../../core/services/patients.service';
import { Patient, Gender, Admission } from '../../../core/models';
import { ApiError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <!-- ── Page Header ──────────────────────────────────────────────────── -->
      <div class="mb-6 flex items-center gap-3">
        <a
          routerLink="/patients"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
          aria-label="Volver a la lista de pacientes"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Detalle del Paciente</h1>
          <p class="mt-0.5 text-sm text-slate-500">Información completa del expediente</p>
        </div>
      </div>

      <!-- ── Loading State ───────────────────────────────────────────────── -->
      @if (loading()) {
        <div class="space-y-4" aria-label="Cargando datos del paciente" aria-busy="true">
          <div class="h-48 animate-pulse rounded-xl bg-slate-200"></div>
          <div class="h-32 animate-pulse rounded-xl bg-slate-200"></div>
          <div class="h-24 animate-pulse rounded-xl bg-slate-200"></div>
        </div>
      }

      <!-- ── Error State ─────────────────────────────────────────────────── -->
      @if (error() && !loading()) {
        <div
          role="alert"
          class="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center"
        >
          <svg
            class="h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-red-700">{{ error() }}</p>
          </div>
          <a
            routerLink="/patients"
            class="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Volver a la lista
          </a>
        </div>
      }

      <!-- ── Patient Data ────────────────────────────────────────────────── -->
      @if (patient() && !loading()) {
        <!-- Action bar -->
        <div class="mb-5 flex flex-wrap items-center gap-3">
          <a
            [routerLink]="['/patients', patient()!.id, 'edit']"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z"
              />
            </svg>
            Editar Paciente
          </a>
          <button
            type="button"
            (click)="navigateToNewAdmission()"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Admisión
          </button>
        </div>

        <!-- ── Card: Identificación ────────────────────────────────────────── -->
        <div class="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <!-- Card header with status badge -->
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg
                  class="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Paciente</p>
                <h2 class="text-lg font-bold text-slate-800">
                  {{ patient()!.names }} {{ patient()!.lastnames }}
                </h2>
              </div>
            </div>
            @if (patient()!.status) {
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                Activo
              </span>
            } @else {
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true"></span>
                Inactivo
              </span>
            }
          </div>

          <!-- Detail grid -->
          <div
            class="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x"
          >
            <dl class="divide-y divide-slate-100">
              <div class="flex justify-between px-6 py-3.5">
                <dt class="text-xs font-medium text-slate-400">Cédula</dt>
                <dd class="font-mono text-sm font-semibold text-slate-700">
                  {{ patient()!.document_id }}
                </dd>
              </div>
              <div class="flex justify-between px-6 py-3.5">
                <dt class="text-xs font-medium text-slate-400">Género</dt>
                <dd class="text-sm text-slate-700">{{ genderLabel(patient()!.gender) }}</dd>
              </div>
              <div class="flex justify-between px-6 py-3.5">
                <dt class="text-xs font-medium text-slate-400">Fecha de Nacimiento</dt>
                <dd class="text-sm text-slate-700">{{ formatBirthDate(patient()!) }}</dd>
              </div>
            </dl>
            <dl class="divide-y divide-slate-100">
              <div class="flex justify-between px-6 py-3.5">
                <dt class="text-xs font-medium text-slate-400">Dirección</dt>
                <dd class="ml-4 text-right text-sm text-slate-700">{{ patient()!.address }}</dd>
              </div>
              <div class="flex justify-between px-6 py-3.5">
                <dt class="text-xs font-medium text-slate-400">ID Interno</dt>
                <dd class="font-mono text-xs text-slate-400">{{ patient()!.id }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- ── Card: Números de Historia ───────────────────────────────────── -->
        <div class="mb-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Números de Historia
            </h2>
            @if (patient()!.history_numbers.length > 0) {
              <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                {{ patient()!.history_numbers.length }}
              </span>
            }
          </div>

          @if (patient()!.history_numbers.length === 0) {
            <p class="text-sm text-slate-400">Sin números de historia registrados.</p>
          } @else {
            <div class="flex flex-wrap gap-2" role="list" aria-label="Números de historia clínica">
              @for (hn of patient()!.history_numbers; track hn) {
                <div
                  role="listitem"
                  class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-1.5 py-1"
                >
                  <span class="text-sm font-mono font-medium text-slate-700">{{ hn }}</span>
                  <button
                    type="button"
                    (click)="onDeleteHistoryNumber(hn)"
                    [disabled]="deletingHistory() === hn"
                    class="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    [attr.aria-label]="'Eliminar historia ' + hn"
                  >
                    @if (deletingHistory() === hn) {
                      <svg
                        class="h-3 w-3 animate-spin"
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
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                        ></path>
                      </svg>
                    } @else {
                      <svg
                        class="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    }
                  </button>
                </div>
              }
            </div>
          }

          @if (historyError()) {
            <p class="mt-3 text-xs text-red-600" role="alert">{{ historyError() }}</p>
          }
        </div>

        <!-- ── Card: Historias Clínicas / Admisiones ───────────────────────── -->
        <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Admisiones</h2>
            @if (clinicalRecords().length > 0) {
              <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                {{ clinicalRecords().length }}
              </span>
            }
          </div>

          @if (clinicalRecords().length === 0) {
            <div class="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <svg
                class="h-10 w-10 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-slate-600">Sin admisiones registradas</p>
                <p class="mt-0.5 text-xs text-slate-400">
                  Cree una nueva admisión para este paciente.
                </p>
              </div>
              <button
                type="button"
                (click)="navigateToNewAdmission()"
                class="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Crear Admisión
              </button>
            </div>
          } @else {
            <div class="divide-y divide-slate-100" role="list" aria-label="Admisiones del paciente">
              @for (record of clinicalRecords(); track record.id) {
                <div
                  role="listitem"
                  class="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <svg
                        class="h-4 w-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-700">Admisión</p>
                      @if (record.admission_date) {
                        <p class="text-xs text-slate-400">
                          {{ formatDate(record.admission_date) }}
                        </p>
                      } @else {
                        <p class="text-xs text-slate-400">Sin fecha de ingreso</p>
                      }
                    </div>
                  </div>
                  <a
                    [routerLink]="['/admissions', record.id]"
                    class="rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Ver detalle
                  </a>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PatientDetailComponent implements OnInit {
  private readonly patientsService = inject(PatientsService);
  private readonly router = inject(Router);

  // ── Route input ────────────────────────────────────────────────────────────
  readonly id = input.required<string>();

  // ── State ──────────────────────────────────────────────────────────────────
  readonly patient = signal<Patient | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deletingHistory = signal<string | null>(null);
  readonly historyError = signal<string | null>(null);

  readonly clinicalRecords = signal<Admission[]>([]);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadPatient();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  genderLabel(gender: Gender): string {
    return gender === 'M' ? 'Masculino' : 'Femenino';
  }

  formatBirthDate(patient: Patient): string {
    const { birth_day, birth_month, birth_year } = patient;
    if (!birth_day && !birth_month && !birth_year) return '—';
    const parts: string[] = [];
    if (birth_day) parts.push(String(birth_day).padStart(2, '0'));
    if (birth_month) parts.push(String(birth_month).padStart(2, '0'));
    if (birth_year) parts.push(String(birth_year));
    return parts.join('/');
  }

  formatDate(dateStr: string): string {
    try {
      return new Intl.DateTimeFormat('es-VE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  // ── Data Loading ───────────────────────────────────────────────────────────
  private loadPatient(): void {
    this.loading.set(true);
    this.error.set(null);
    this.patientsService.getById(this.id()).subscribe({
      next: (p) => {
        this.patient.set(p);
        this.clinicalRecords.set(p.admissions ?? []);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message ?? 'Error al cargar el paciente.');
        this.loading.set(false);
      },
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  navigateToNewAdmission(): void {
    this.router.navigate(['/admissions/new'], {
      queryParams: { patient_id: this.id() },
    });
  }

  onDeleteHistoryNumber(historyNumber: string): void {
    const confirmed = window.confirm(`¿Desea eliminar el número de historia "${historyNumber}"?`);
    if (!confirmed) return;

    this.deletingHistory.set(historyNumber);
    this.historyError.set(null);

    this.patientsService.deleteHistoryNumber(this.id(), historyNumber).subscribe({
      next: () => {
        this.deletingHistory.set(null);
        // Remove from local patient state without refetch
        const current = this.patient();
        if (current) {
          const updated: Patient = {
            ...current,
            history_numbers: current.history_numbers.filter((h) => h !== historyNumber),
          };
          this.patient.set(updated);
        }
      },
      error: (err: ApiError) => {
        this.deletingHistory.set(null);
        this.historyError.set(err.message ?? 'Error al eliminar el número de historia.');
      },
    });
  }
}
