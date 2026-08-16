// ─────────────────────────────────────────────────────────────────────────────
// DischargesListComponent — Lista de Egresos Hospitalarios
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { SlicePipe } from '@angular/common';

import { DischargesService } from '../../../core/services/clinical-records.service';
import { Discharge } from '../../../core/models';

@Component({
  selector: 'app-discharges-list',
  imports: [RouterLink, SlicePipe],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-8">

      <!-- ── Page Header ─────────────────────────────────────────────── -->
      <div class="mx-auto max-w-7xl">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-slate-800">Egresos Hospitalarios</h1>
            <p class="mt-1 text-sm text-slate-500">
              Registro de altas médicas y fallecimientos
            </p>
          </div>
          <a
            routerLink="/discharges/new"
            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Egreso
          </a>
        </div>

        <!-- ── Loading State ──────────────────────────────────────────── -->
        @if (loading()) {
          <div class="flex items-center justify-center py-24" role="status" aria-label="Cargando egresos">
            <div class="flex flex-col items-center gap-4">
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p class="text-sm text-slate-500">Cargando egresos&hellip;</p>
            </div>
          </div>
        }

        <!-- ── Error State ────────────────────────────────────────────── -->
        @if (error() && !loading()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm" role="alert">
            <div class="flex items-start gap-3">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <p class="font-semibold text-red-700">Error al cargar los egresos</p>
                <p class="mt-0.5 text-sm text-red-600">{{ error() }}</p>
                <button
                  (click)="loadDischarges()"
                  class="mt-3 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ── Empty State ────────────────────────────────────────────── -->
        @if (!loading() && !error() && discharges().length === 0) {
          <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <div class="mb-4 rounded-full bg-slate-100 p-5">
              <svg class="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-700">No hay egresos registrados</h3>
            <p class="mt-1 text-sm text-slate-400">Comience registrando el primer egreso hospitalario.</p>
            <a
              routerLink="/discharges/new"
              class="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Registrar Egreso
            </a>
          </div>
        }

        <!-- ── Data Table ─────────────────────────────────────────────── -->
        @if (!loading() && !error() && discharges().length > 0) {
          <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <!-- Summary bar -->
            <div class="border-b border-slate-100 bg-slate-50 px-6 py-3">
              <p class="text-xs font-medium text-slate-500">
                {{ totalCount() }} egreso{{ totalCount() !== 1 ? 's' : '' }} registrado{{ totalCount() !== 1 ? 's' : '' }}
                &nbsp;&middot;&nbsp;
                <span class="text-green-600">{{ altaCount() }} alta{{ altaCount() !== 1 ? 's' : '' }} m&eacute;dica{{ altaCount() !== 1 ? 's' : '' }}</span>
                &nbsp;&middot;&nbsp;
                <span class="text-red-600">{{ fallecidoCount() }} fallecimiento{{ fallecidoCount() !== 1 ? 's' : '' }}</span>
              </p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm" aria-label="Lista de egresos hospitalarios">
                <thead>
                  <tr class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th class="px-6 py-4" scope="col">Admisi&oacute;n ID</th>
                    <th class="px-6 py-4" scope="col">Fecha de Egreso</th>
                    <th class="px-6 py-4" scope="col">Estado Morbilidad</th>
                    <th class="px-6 py-4" scope="col">Diagn&oacute;sticos</th>
                    <th class="px-6 py-4 text-right" scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (discharge of discharges(); track discharge.id) {
                    <tr class="group transition-colors hover:bg-slate-50/80">

                      <!-- Admision ID -->
                      <td class="px-6 py-4">
                        <span class="font-mono text-xs text-slate-600">{{ discharge.admission_id | slice:0:8 }}&hellip;</span>
                      </td>

                      <!-- Fecha de Egreso -->
                      <td class="px-6 py-4 text-slate-700">
                        @if (discharge.discharge_date) {
                          <span>{{ formatDate(discharge.discharge_date) }}</span>
                        } @else {
                          <span class="italic text-slate-400">No registrada</span>
                        }
                      </td>

                      <!-- Estado Morbilidad -->
                      <td class="px-6 py-4">
                        @if (discharge.morbility_status === true) {
                          <span class="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                            <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            Fallecido
                          </span>
                        } @else if (discharge.morbility_status === false) {
                          <span class="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                            <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            Alta M&eacute;dica
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                            <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            N/A
                          </span>
                        }
                      </td>

                      <!-- Diagnosticos count -->
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                          </svg>
                          {{ discharge.discharges_diagnosis?.length ?? 0 }} diagn&oacute;stico{{ (discharge.discharges_diagnosis?.length ?? 0) !== 1 ? 's' : '' }}
                        </span>
                      </td>

                      <!-- Acciones -->
                      <td class="px-6 py-4">
                        <div class="flex items-center justify-end gap-1.5">
                          <a
                            [routerLink]="['/discharges', discharge.id]"
                            title="Ver detalle"
                            aria-label="Ver detalle del egreso"
                            class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </a>
                          <a
                            [routerLink]="['/discharges', discharge.id, 'edit']"
                            title="Editar egreso"
                            aria-label="Editar egreso"
                            class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </a>
                          <button
                            (click)="confirmDelete(discharge)"
                            title="Eliminar egreso"
                            aria-label="Eliminar egreso"
                            class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ── Delete Confirmation Modal ──────────────────────────────── -->
        @if (deletingDischarge()) {
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div class="mb-4 flex items-center gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <h2 id="delete-modal-title" class="text-lg font-semibold text-slate-800">Eliminar Egreso</h2>
              </div>
              <p class="mb-6 text-sm text-slate-600">
                &iquest;Est&aacute; seguro de que desea eliminar este egreso? Esta acci&oacute;n no se puede deshacer.
              </p>
              <div class="flex items-center justify-end gap-3">
                <button
                  (click)="deletingDischarge.set(null)"
                  class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  (click)="deleteDischarge()"
                  [disabled]="deleteLoading()"
                  class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  @if (deleteLoading()) {
                    <div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  }
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class DischargesListComponent implements OnInit {
  private readonly dischargesService = inject(DischargesService);
  private readonly router = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly discharges = signal<Discharge[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingDischarge = signal<Discharge | null>(null);
  readonly deleteLoading = signal(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly totalCount = computed(() => this.discharges().length);
  readonly altaCount = computed(
    () => this.discharges().filter(d => d.morbility_status === false).length,
  );
  readonly fallecidoCount = computed(
    () => this.discharges().filter(d => d.morbility_status === true).length,
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDischarges();
  }

  // ── Methods ────────────────────────────────────────────────────────────────
  loadDischarges(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dischargesService.getAll().subscribe({
      next: (data) => {
        this.discharges.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudieron cargar los egresos.');
        this.loading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    try {
      return new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  confirmDelete(discharge: Discharge): void {
    this.deletingDischarge.set(discharge);
  }

  deleteDischarge(): void {
    const discharge = this.deletingDischarge();
    if (!discharge) return;

    this.deleteLoading.set(true);
    this.dischargesService.delete(discharge.id).subscribe({
      next: () => {
        this.discharges.update(list => list.filter(d => d.id !== discharge.id));
        this.deletingDischarge.set(null);
        this.deleteLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al eliminar el egreso.');
        this.deletingDischarge.set(null);
        this.deleteLoading.set(false);
      },
    });
  }
}
