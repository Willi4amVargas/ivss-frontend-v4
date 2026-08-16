import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PatientsService } from '../../core/services/patients.service';
import { AdmissionsService, DischargesService } from '../../core/services/clinical-records.service';
import { Admission } from '../../core/models';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Component — Hospital Dr. Patrocinio Peñuela Ruíz
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- ── Top Header Bar ────────────────────────────────────────────────── -->
      <header class="bg-[#1e3a5f] text-white shadow-lg">
        <div class="mx-auto max-w-7xl px-6 py-5 flex items-center gap-4">
          <!-- Hospital Cross Icon -->
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25"
          >
            <svg
              class="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m-8-8h16" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight leading-none">
              Sistema de Gestión Hospitalaria
            </h1>
            <p class="mt-0.5 text-sm text-blue-200 font-medium">
              Hospital Dr. Patrocinio Peñuela Ruíz &mdash; Medicina Interna
            </p>
          </div>
          <!-- Current date badge -->
          <div
            class="ml-auto hidden sm:flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-blue-100"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
            <span>{{ todayLabel }}</span>
          </div>
        </div>
      </header>

      <!-- ── Page Content ───────────────────────────────────────────────────── -->
      <main class="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <!-- ── Stat Cards ─────────────────────────────────────────────────── -->
        <section aria-label="Estadísticas generales">
          <h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Resumen General
          </h2>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            @if (isLoading()) {
              @for (sk of skeletons; track sk) {
                <div
                  class="animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
                  aria-hidden="true"
                >
                  <div class="flex items-center gap-4">
                    <div class="h-12 w-12 rounded-xl bg-slate-200"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-3 w-2/3 rounded bg-slate-200"></div>
                      <div class="h-6 w-1/3 rounded bg-slate-200"></div>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <!-- Patients Card -->
              <article
                class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
                aria-label="Total de pacientes registrados"
              >
                <div class="absolute inset-y-0 right-0 w-1 rounded-r-2xl bg-blue-500"></div>
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                  >
                    <svg
                      class="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.7"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                      />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p
                      class="truncate text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Pacientes Registrados
                    </p>
                    <p class="mt-0.5 text-3xl font-bold text-slate-800 tabular-nums">
                      {{ totalPatients() }}
                    </p>
                  </div>
                </div>
                <div class="mt-4 border-t border-slate-50 pt-3">
                  <a
                    routerLink="/patients"
                    class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    aria-label="Ver listado de pacientes"
                  >
                    Ver listado
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </a>
                </div>
              </article>

              <!-- Admissions Card -->
              <article
                class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
                aria-label="Total de admisiones activas"
              >
                <div class="absolute inset-y-0 right-0 w-1 rounded-r-2xl bg-amber-500"></div>
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                  >
                    <svg
                      class="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.7"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                      />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p
                      class="truncate text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Admisiones Activas
                    </p>
                    <p class="mt-0.5 text-3xl font-bold text-slate-800 tabular-nums">
                      {{ totalAdmissions() }}
                    </p>
                  </div>
                </div>
                <div class="mt-4 border-t border-slate-50 pt-3">
                  <a
                    routerLink="/admissions"
                    class="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                    aria-label="Ver listado de admisiones"
                  >
                    Ver listado
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </a>
                </div>
              </article>

              <!-- Discharges Card -->
              <article
                class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
                aria-label="Total de egresos registrados"
              >
                <div class="absolute inset-y-0 right-0 w-1 rounded-r-2xl bg-emerald-500"></div>
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                  >
                    <svg
                      class="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.7"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p
                      class="truncate text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Egresos Registrados
                    </p>
                    <p class="mt-0.5 text-3xl font-bold text-slate-800 tabular-nums">
                      {{ totalDischarges() }}
                    </p>
                  </div>
                </div>
                <div class="mt-4 border-t border-slate-50 pt-3">
                  <a
                    routerLink="/discharges"
                    class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                    aria-label="Ver listado de egresos"
                  >
                    Ver listado
                    <svg
                      class="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </a>
                </div>
              </article>
            }
          </div>
        </section>

        <!-- ── Lower Grid: Recent Admissions + Quick Actions ────────────────── -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Recent Admissions Table (spans 2 cols) -->
          <section
            class="lg:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden"
            aria-label="Admisiones recientes"
          >
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div class="flex items-center gap-2">
                <svg
                  class="h-4 w-4 text-[#1e3a5f]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                  />
                </svg>
                <h2 class="text-sm font-semibold text-slate-700">Admisiones Recientes</h2>
              </div>
              <span
                class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500"
              >
                Últimas {{ recentAdmissions().length }}
              </span>
            </div>

            @if (isLoading()) {
              <div class="divide-y divide-slate-50 px-6" aria-hidden="true">
                @for (sk of skeletons; track sk) {
                  <div class="flex animate-pulse items-center gap-4 py-4">
                    <div class="h-3 w-24 rounded bg-slate-200"></div>
                    <div class="h-3 w-36 flex-1 rounded bg-slate-200"></div>
                    <div class="h-3 w-20 rounded bg-slate-200"></div>
                    <div class="h-3 w-16 rounded bg-slate-200"></div>
                  </div>
                }
              </div>
            } @else if (recentAdmissions().length === 0) {
              <div class="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                <svg
                  class="h-10 w-10 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
                  />
                </svg>
                <p class="text-sm font-medium">Sin admisiones registradas</p>
                <p class="text-xs">Las nuevas admisiones aparecerán aquí.</p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm" aria-label="Tabla de admisiones recientes">
                  <thead>
                    <tr class="bg-slate-50 text-left">
                      <th
                        scope="col"
                        class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        #
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        ID Admisión
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        Motivo Principal
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        Fecha
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    @for (admission of recentAdmissions(); track admission.id; let i = $index) {
                      <tr class="transition-colors hover:bg-slate-50/70">
                        <td class="px-6 py-3.5 text-xs font-medium text-slate-400 tabular-nums">
                          {{ i + 1 }}
                        </td>
                        <td class="px-4 py-3.5">
                          <span class="font-mono text-xs text-slate-500">
                            {{ admission.id.slice(0, 8) }}&hellip;
                          </span>
                        </td>
                        <td class="max-w-[200px] px-4 py-3.5">
                          <p class="truncate text-sm font-medium text-slate-700">
                            {{ admission.consult_reason[0] ?? '—' }}
                          </p>
                        </td>
                        <td class="px-4 py-3.5 text-xs text-slate-500 tabular-nums">
                          {{ formatDate(admission.admission_date) }}
                        </td>
                        <td class="px-4 py-3.5">
                          @if (admission.discharge) {
                            <span
                              class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100"
                            >
                              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Egresado
                            </span>
                          } @else {
                            <span
                              class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100"
                            >
                              <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                              Activo
                            </span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>

          <!-- Quick Actions Panel -->
          <section
            class="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden"
            aria-label="Acciones rápidas"
          >
            <div class="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <svg
                class="h-4 w-4 text-[#1e3a5f]"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                />
              </svg>
              <h2 class="text-sm font-semibold text-slate-700">Acciones Rápidas</h2>
            </div>

            <div class="flex flex-col gap-3 p-5">
              <a
                routerLink="/patients/new"
                class="group flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Registrar nuevo paciente"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2.2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
                Nuevo Paciente
              </a>

              <a
                routerLink="/admissions/new"
                class="group flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label="Registrar nueva admisión"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm transition-transform group-hover:scale-105"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2.2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
                Nueva Admisión
              </a>

              <a
                routerLink="/discharges/new"
                class="group flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Registrar nuevo egreso"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm transition-transform group-hover:scale-105"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2.2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
                Nuevo Egreso
              </a>

              <div class="my-1 h-px bg-slate-100" role="separator" aria-hidden="true"></div>

              <a
                routerLink="/patients"
                class="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                aria-label="Ver listado completo de pacientes"
              >
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f] text-white shadow-sm transition-transform group-hover:scale-105"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                    />
                  </svg>
                </span>
                Ver Pacientes
              </a>
            </div>
          </section>
        </div>

        <!-- ── Error Banner ────────────────────────────────────────────────── -->
        @if (hasError()) {
          <div
            class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
            role="alert"
            aria-live="assertive"
          >
            <svg
              class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <div>
              <p class="text-sm font-semibold">Error al cargar los datos</p>
              <p class="mt-0.5 text-xs text-red-600">
                No fue posible conectar con el servidor. Verifique su conexión y recargue la página.
              </p>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [],
})
export class DashboardComponent implements OnInit {
  // ── Services ───────────────────────────────────────────────────────────────
  private readonly patientsService = inject(PatientsService);
  private readonly admissionsService = inject(AdmissionsService);
  private readonly dischargesService = inject(DischargesService);

  // ── State signals ──────────────────────────────────────────────────────────
  private readonly _admissions = signal<Admission[]>([]);
  readonly totalPatients = signal<number>(0);
  readonly totalAdmissions = signal<number>(0);
  readonly totalDischarges = signal<number>(0);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);

  // ── Derived signals ────────────────────────────────────────────────────────
  /** Latest 5 admissions shown in the recent table */
  readonly recentAdmissions = computed<Admission[]>(() => [...this._admissions()].slice(0, 5));

  // ── Skeleton placeholders (static, purely visual) ─────────────────────────
  readonly skeletons = [1, 2, 3] as const;

  // ── Today's localised label ────────────────────────────────────────────────
  readonly todayLabel = new Intl.DateTimeFormat('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDashboardData();
  }

  // ── Data loading (parallel) ────────────────────────────────────────────────
  private loadDashboardData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    forkJoin({
      patients: this.patientsService.getAll(),
      admissions: this.admissionsService.getAll(),
      discharges: this.dischargesService.getAll(),
    }).subscribe({
      next: ({ patients, admissions, discharges }) => {
        this.totalPatients.set(patients.length);
        this.totalAdmissions.set(admissions.length);
        this.totalDischarges.set(discharges.length);
        this._admissions.set(admissions);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Formats an ISO date string to a short localised date, or '—' if absent. */
  formatDate(isoDate?: string): string {
    if (!isoDate) return '—';
    return new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(isoDate));
  }
}
