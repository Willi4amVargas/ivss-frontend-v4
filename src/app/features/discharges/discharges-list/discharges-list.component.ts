import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe, DatePipe, TitleCasePipe } from '@angular/common';

import { DischargesService } from '../../../core/services/clinical-records.service';
import { Discharge } from '../../../core/models';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-discharges-list',
  imports: [RouterLink, SlicePipe, DatePipe, TitleCasePipe],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-8 flex flex-col">
      <!-- ── Page Header ─────────────────────────────────────────────── -->
      <div class="mx-auto max-w-7xl w-full">
        <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Egresos Hospitalarios</h1>
            <p class="mt-1 text-sm text-slate-500">Registro de altas médicas y fallecimientos</p>
          </div>
          <a
            routerLink="/discharges/new"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Egreso
          </a>
        </div>

        <!-- ── Filters ────────────────────────────────────────────────── -->
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <!-- Status Filter -->
          <div class="w-full sm:w-48">
            <label for="status-filter" class="sr-only">Estado de Morbilidad</label>
            <select
              id="status-filter"
              [value]="filterStatus()"
              (change)="onStatusChange($event)"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Todos los estados</option>
              <option value="alive">Solo Altas Médicas</option>
              <option value="deceased">Solo Fallecimientos</option>
            </select>
          </div>

          <!-- Date Filter -->
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

        <!-- ── Loading State ──────────────────────────────────────────── -->
        @if (loading()) {
          <div
            class="flex items-center justify-center py-24"
            role="status"
            aria-label="Cargando egresos"
          >
            <div class="flex flex-col items-center gap-4">
              <svg
                class="h-10 w-10 animate-spin text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <p class="text-sm font-medium text-slate-500">Cargando egresos&hellip;</p>
            </div>
          </div>
        }

        <!-- ── Error State ────────────────────────────────────────────── -->
        @if (error() && !loading()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm mb-6" role="alert">
            <div class="flex items-start gap-3">
              <svg
                class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
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
        @if (!loading() && !error() && filteredDischarges().length === 0) {
          <div
            class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center"
          >
            <div class="mb-4 rounded-full bg-slate-100 p-5">
              <svg
                class="h-10 w-10 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-700">No se encontraron egresos</h3>
            <p class="mt-1 text-sm text-slate-400">
              Pruebe cambiando los filtros o registre un nuevo egreso.
            </p>
            <a
              routerLink="/discharges/new"
              class="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Registrar Egreso
            </a>
          </div>
        }

        <!-- ── Data Table ─────────────────────────────────────────────── -->
        @if (!loading() && !error() && filteredDischarges().length > 0) {
          <div
            class="overflow-hidden flex flex-col flex-1 rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div class="overflow-x-auto flex-1">
              <table class="w-full text-sm" aria-label="Lista de egresos hospitalarios">
                <thead>
                  <tr
                    class="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    <th class="px-6 py-4" scope="col">Información de Admisión</th>
                    <th class="px-6 py-4" scope="col">Fecha de Egreso</th>
                    <th class="px-6 py-4" scope="col">Estado Morbilidad</th>
                    <th class="px-6 py-4 text-center" scope="col">Diagnósticos</th>
                    <th class="px-6 py-4 text-right" scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (discharge of paginatedDischarges(); track discharge.id) {
                    <tr class="group transition hover:bg-slate-50/80">
                      <!-- Admision Info -->
                      <td class="px-6 py-4">
                        @if (discharge.admission && discharge.admission.patient) {
                          <div class="flex items-center gap-3">
                            <div
                              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"
                            >
                              <svg
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                              </svg>
                            </div>
                            <div class="flex flex-col">
                              <span class="text-sm font-semibold text-slate-800">
                                {{ discharge.admission.patient.names | titlecase }}
                                {{ discharge.admission.patient.lastnames | titlecase }}
                              </span>
                              <a
                                [routerLink]="['/admissions', discharge.admission_id]"
                                class="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
                              >
                                Ver ficha de admisión
                                <svg
                                  class="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  stroke-width="2"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                  />
                                </svg>
                              </a>
                            </div>
                          </div>
                        } @else {
                          <a
                            [routerLink]="['/admissions', discharge.admission_id]"
                            class="font-mono text-xs text-blue-600 hover:underline"
                          >
                            {{ discharge.admission_id | slice: 0 : 8 }}&hellip;
                          </a>
                        }
                      </td>

                      <!-- Fecha de Egreso -->
                      <td class="px-6 py-4 text-slate-700">
                        @if (discharge.discharge_date) {
                          <span class="inline-flex items-center gap-1.5">
                            <svg
                              class="h-3.5 w-3.5 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {{ discharge.discharge_date | date: 'dd/MM/yyyy HH:mm' }}
                          </span>
                        } @else {
                          <span class="italic text-slate-400">No registrada</span>
                        }
                      </td>

                      <!-- Estado Morbilidad -->
                      <td class="px-6 py-4">
                        @if (discharge.morbility_status === true) {
                          <span
                            class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                          >
                            <span class="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                            Fallecido
                          </span>
                        } @else if (discharge.morbility_status === false) {
                          <span
                            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                          >
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Alta Médica
                          </span>
                        } @else {
                          <span
                            class="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200"
                          >
                            <span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                            N/A
                          </span>
                        }
                      </td>

                      <!-- Diagnosticos count -->
                      <td class="px-6 py-4 text-center">
                        <span
                          class="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          [class.bg-blue-50]="(discharge.discharges_diagnosis?.length || 0) > 0"
                          [class.text-blue-700]="(discharge.discharges_diagnosis?.length || 0) > 0"
                          [class.bg-slate-100]="(discharge.discharges_diagnosis?.length || 0) === 0"
                          [class.text-slate-500]="
                            (discharge.discharges_diagnosis?.length || 0) === 0
                          "
                        >
                          {{ discharge.discharges_diagnosis?.length ?? 0 }}
                        </span>
                      </td>

                      <!-- Acciones -->
                      <td class="px-6 py-4">
                        <div class="flex items-center justify-end gap-1.5">
                          <a
                            [routerLink]="['/discharges', discharge.id]"
                            class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1e3a5f] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                            aria-label="Ver detalle"
                          >
                            <svg
                              class="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              stroke-width="2"
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
                          <a
                            [routerLink]="['/discharges', discharge.id, 'edit']"
                            class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            aria-label="Editar"
                          >
                            <svg
                              class="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Editar
                          </a>
                          <button
                            (click)="confirmDelete(discharge)"
                            class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Eliminar"
                          >
                            <svg
                              class="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              stroke-width="2"
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
            <div
              class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-3 mt-auto"
            >
              <p class="text-xs text-slate-500 text-center sm:text-left">
                Mostrando <span class="font-medium text-slate-700">{{ pageStart() }}</span> a
                <span class="font-medium text-slate-700">{{ pageEnd() }}</span> de
                <span class="font-medium text-slate-700">{{ totalItems() }}</span> resultados
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="prevPage()"
                  [disabled]="currentPage() === 1"
                  class="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  (click)="nextPage()"
                  [disabled]="currentPage() >= totalPages()"
                  class="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
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
            <div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100"
                >
                  <svg
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
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <h2 id="delete-modal-title" class="text-base font-semibold text-slate-800">
                  Eliminar Egreso
                </h2>
              </div>
              <p class="mb-6 text-sm text-slate-600">
                &iquest;Est&aacute; seguro de que desea eliminar este egreso? Esta acci&oacute;n no
                se puede deshacer.
              </p>
              <div class="flex items-center justify-end gap-3">
                <button
                  (click)="deletingDischarge.set(null)"
                  [disabled]="deleteLoading()"
                  class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  (click)="deleteDischarge()"
                  [disabled]="deleteLoading()"
                  class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  @if (deleteLoading()) {
                    <svg
                      class="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
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
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Eliminando...
                  } @else {
                    Eliminar
                  }
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

  // ── State ──────────────────────────────────────────────────────────────────
  readonly discharges = signal<Discharge[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Filters
  readonly filterDate = signal<string>('');
  readonly filterStatus = signal<'all' | 'alive' | 'deceased'>('all');

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly deletingDischarge = signal<Discharge | null>(null);
  readonly deleteLoading = signal(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly filteredDischarges = computed(() => {
    let list = this.discharges();

    // Morbility status filter
    const status = this.filterStatus();
    if (status === 'alive') {
      list = list.filter((d) => d.morbility_status === false);
    } else if (status === 'deceased') {
      list = list.filter((d) => d.morbility_status === true);
    }

    // Date filter
    const dateQuery = this.filterDate();
    if (dateQuery) {
      list = list.filter((d) => {
        if (!d.discharge_date) return false;
        // Check if starts with the date string (e.g. 2026-03-30)
        return d.discharge_date.startsWith(dateQuery);
      });
    }

    return list;
  });

  // Pagination Computeds
  readonly totalItems = computed(() => this.filteredDischarges().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  readonly paginatedDischarges = computed(() => {
    const list = this.filteredDischarges();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  readonly pageStart = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

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
        this.currentPage.set(1);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'No se pudieron cargar los egresos.');
        this.loading.set(false);
      },
    });
  }

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as 'all' | 'alive' | 'deceased';
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }

  onDateChange(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    this.filterDate.set(date);
    this.currentPage.set(1);
  }

  clearDate(): void {
    this.filterDate.set('');
    this.currentPage.set(1);
  }

  // Pagination Actions
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  confirmDelete(discharge: Discharge): void {
    this.deletingDischarge.set(discharge);
  }

  deleteDischarge(): void {
    const target = this.deletingDischarge();
    if (!target) return;

    this.deleteLoading.set(true);
    this.dischargesService
      .delete(target.id)
      .pipe(
        finalize(() => {
          this.deletingDischarge.set(null);
          this.deleteLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.discharges.update((list) => list.filter((d) => d.id !== target.id));
          this.deletingDischarge.set(null);
          this.deleteLoading.set(false);

          // Adjust page if we deleted the last item on the current page
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(Math.max(1, this.totalPages()));
          }
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? err?.message ?? 'Error al eliminar el egreso.');
          this.deletingDischarge.set(null);
          this.deleteLoading.set(false);
        },
      });
  }
}
