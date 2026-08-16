import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PatientsService } from '../../../core/services/patients.service';
import { Patient, Gender } from '../../../core/models';
import { ApiError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-patients-list',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <!-- Page Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p class="mt-1 text-sm text-slate-500">Gestión de pacientes registrados en el sistema</p>
        </div>
        <a
          routerLink="/patients/new"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Paciente
        </a>
      </div>

      <!-- Search Bar -->
      <div class="mb-5">
        <div class="relative">
          <svg
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
            placeholder="Buscar por nombre, cédula o número de historia…"
            aria-label="Buscar pacientes"
            class="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <!-- Error State -->
      @if (error()) {
        <div
          role="alert"
          class="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <svg class="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
          </svg>
          <span>{{ error() }}</span>
        </div>
      }

      <!-- Table Card -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <!-- Loading Skeleton -->
        @if (loading()) {
          <div class="divide-y divide-slate-100" aria-label="Cargando pacientes" aria-busy="true">
            @for (_ of skeletonRows; track $index) {
              <div class="flex items-center gap-4 px-6 py-4">
                <div class="h-4 w-28 animate-pulse rounded bg-slate-200"></div>
                <div class="h-4 w-48 animate-pulse rounded bg-slate-200"></div>
                <div class="h-4 w-20 animate-pulse rounded bg-slate-200"></div>
                <div class="h-5 w-16 animate-pulse rounded-full bg-slate-200"></div>
                <div class="ml-auto flex gap-2">
                  <div class="h-7 w-16 animate-pulse rounded bg-slate-200"></div>
                  <div class="h-7 w-14 animate-pulse rounded bg-slate-200"></div>
                  <div class="h-7 w-16 animate-pulse rounded bg-slate-200"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Data Table -->
        @if (!loading()) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200" aria-label="Lista de pacientes">
              <thead class="bg-slate-50">
                <tr>
                  <th scope="col" class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cédula
                  </th>
                  <th scope="col" class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nombre Completo
                  </th>
                  <th scope="col" class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Género
                  </th>
                  <th scope="col" class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>
                  <th scope="col" class="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (patient of filteredPatients(); track patient.id) {
                  <tr class="transition-colors hover:bg-slate-50/70">
                    <td class="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-700">
                      {{ patient.document_id }}
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-sm font-medium text-slate-800">
                        {{ patient.names }} {{ patient.lastnames }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {{ genderLabel(patient.gender) }}
                    </td>
                    <td class="whitespace-nowrap px-6 py-4">
                      @if (patient.status) {
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                          Activo
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                          <span class="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true"></span>
                          Inactivo
                        </span>
                      }
                    </td>
                    <td class="whitespace-nowrap px-6 py-4 text-right">
                      <div class="inline-flex items-center gap-1.5">
                        <a
                          [routerLink]="['/patients', patient.id]"
                          class="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Ver detalle de {{ patient.names }} {{ patient.lastnames }}"
                        >
                          Ver
                        </a>
                        <a
                          [routerLink]="['/patients', patient.id, 'edit']"
                          class="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          aria-label="Editar paciente {{ patient.names }} {{ patient.lastnames }}"
                        >
                          Editar
                        </a>
                        <button
                          type="button"
                          (click)="onDelete(patient)"
                          [disabled]="deletingId() === patient.id"
                          class="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Eliminar paciente {{ patient.names }} {{ patient.lastnames }}"
                        >
                          @if (deletingId() === patient.id) {
                            <span aria-label="Eliminando...">…</span>
                          } @else {
                            Eliminar
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          @if (filteredPatients().length === 0) {
            <div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <svg class="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              </svg>
              @if (searchQuery()) {
                <div>
                  <p class="text-sm font-medium text-slate-700">Sin resultados para "{{ searchQuery() }}"</p>
                  <p class="mt-1 text-xs text-slate-400">Intente buscar con otros términos.</p>
                </div>
              } @else {
                <div>
                  <p class="text-sm font-medium text-slate-700">No hay pacientes registrados</p>
                  <p class="mt-1 text-xs text-slate-400">Comience registrando el primer paciente.</p>
                </div>
              }
            </div>
          }

          <!-- Footer count -->
          @if (filteredPatients().length > 0) {
            <div class="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
              <p class="text-xs text-slate-400">
                @if (searchQuery()) {
                  {{ filteredPatients().length }} de {{ patients().length }} pacientes
                } @else {
                  {{ patients().length }} paciente{{ patients().length !== 1 ? 's' : '' }} en total
                }
              </p>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class PatientsListComponent implements OnInit {
  private readonly patientsService = inject(PatientsService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly patients    = signal<Patient[]>([]);
  readonly loading     = signal(true);
  readonly error       = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly deletingId  = signal<string | null>(null);

  readonly skeletonRows = Array.from({ length: 6 });

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly filteredPatients = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.patients();
    return this.patients().filter((p) => {
      const fullName  = `${p.names} ${p.lastnames}`.toLowerCase();
      const cedula    = p.document_id.toLowerCase();
      const histories = p.history_numbers.join(' ').toLowerCase();
      return fullName.includes(q) || cedula.includes(q) || histories.includes(q);
    });
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadPatients();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  genderLabel(gender: Gender): string {
    return gender === 'M' ? 'Masculino' : 'Femenino';
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  private loadPatients(): void {
    this.loading.set(true);
    this.error.set(null);
    this.patientsService.getAll().subscribe({
      next: (list) => {
        this.patients.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message ?? 'Error al cargar los pacientes.');
        this.loading.set(false);
      },
    });
  }

  onDelete(patient: Patient): void {
    const confirmed = window.confirm(
      `¿Desea eliminar al paciente ${patient.names} ${patient.lastnames}?\nEsta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    this.deletingId.set(patient.id);
    this.error.set(null);

    this.patientsService.delete(patient.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadPatients();
      },
      error: (err: ApiError) => {
        this.deletingId.set(null);
        if (err.status === 409) {
          this.error.set(
            `No se puede eliminar al paciente ${patient.names} ${patient.lastnames} porque tiene historias clínicas asociadas.`,
          );
        } else {
          this.error.set(err.message ?? 'Error al eliminar el paciente.');
        }
      },
    });
  }
}
