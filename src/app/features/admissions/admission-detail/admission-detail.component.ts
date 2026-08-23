import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  AdmissionsService,
  EvolutionsService,
} from '../../../core/services/clinical-records.service';
import { Admission, Evolution } from '../../../core/models';

@Component({
  selector: 'app-admission-detail',
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header skeleton -->
      @if (isLoading()) {
        <div class="mb-8 animate-pulse space-y-3" role="status" aria-label="Cargando admisión">
          <div class="h-7 w-64 rounded-lg bg-slate-200"></div>
          <div class="h-4 w-40 rounded bg-slate-100"></div>
        </div>
        <div class="space-y-5">
          @for (_ of [1, 2, 3, 4]; track $index) {
            <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div class="mb-4 h-5 w-36 animate-pulse rounded bg-slate-200"></div>
              <div class="space-y-2">
                <div class="h-4 w-full animate-pulse rounded bg-slate-100"></div>
                <div class="h-4 w-3/4 animate-pulse rounded bg-slate-100"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error state -->
      @if (!isLoading() && errorMsg()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
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
          <p class="text-sm font-semibold text-red-700">Error al cargar la admisión</p>
          <p class="mt-1 text-xs text-red-600">{{ errorMsg() }}</p>
          <a
            routerLink="/admissions"
            class="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
          >
            Volver a Admisiones
          </a>
        </div>
      }

      <!-- Content -->
      @if (!isLoading() && !errorMsg() && admission()) {
        <!-- Page Header -->
        <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <a
              routerLink="/admissions"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              aria-label="Volver a la lista de admisiones"
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
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </a>
            <div>
              <div class="flex items-center gap-2">
                <span class="rounded-full bg-[#1e3a5f] px-2 py-0.5 text-xs font-semibold text-white"
                  >Admisión</span
                >
                <h1 class="text-2xl font-bold text-slate-800">Ficha Clínica</h1>
              </div>
              <p class="mt-0.5 font-mono text-xs text-slate-400">ID: {{ admission()!.id }}</p>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="downloadPdf()"
              [disabled]="isDownloading()"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
            >
              @if (isDownloading()) {
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
                Descargando...
              } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar PDF
              }
            </button>
            <a
              [routerLink]="['/admissions', admission()!.id, 'edit']"
              class="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar Admisión
            </a>
            @if (!admission()!.discharge) {
              <a
                [routerLink]="['/discharges/new']"
                [queryParams]="{ admission_id: admission()!.id }"
                class="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#16304f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Registrar Egreso
              </a>
            }
          </div>
        </div>

        <div class="space-y-6">
          <!-- ─── Patient & Date Info ─────────────────────────────────────── -->
          <section
            class="rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="section-info"
          >
            <div class="border-b border-slate-100 px-6 py-4">
              <h2
                id="section-info"
                class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
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
                Información General
              </h2>
            </div>
            <dl
              class="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
            >
              <div class="px-6 py-4">
                <dt class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Paciente Asociado
                </dt>
                <dd>
                  @if (admission()!.patient) {
                    <a
                      [routerLink]="['/patients', admission()!.patient_id]"
                      class="group flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2 transition hover:bg-blue-50 hover:border-blue-100"
                    >
                      <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f]"
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div class="flex flex-col">
                        <span
                          class="text-sm font-semibold text-slate-800 group-hover:text-[#1e3a5f]"
                        >
                          {{ admission()!.patient.names }} {{ admission()!.patient.lastnames }}
                        </span>
                        <span class="text-xs font-mono text-slate-500">
                          V-{{ admission()!.patient.document_id }}
                        </span>
                      </div>
                    </a>
                  } @else {
                    <span class="font-mono text-sm text-slate-800">{{
                      admission()!.patient_id
                    }}</span>
                  }
                </dd>
              </div>
              <div class="px-6 py-4">
                <dt class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Fecha de Admisión
                </dt>
                <dd class="text-sm text-slate-800">
                  @if (admission()!.admission_date) {
                    <span class="inline-flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 text-slate-400"
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
                      {{ admission()!.admission_date | date: 'dd/MM/yyyy HH:mm' }}
                    </span>
                  } @else {
                    <span class="italic text-slate-400">Sin fecha registrada</span>
                  }
                  <!-- Creator info row -->
                  @if (admission()!.user || admission()!.created_at) {
                    <div
                      class="border-t border-slate-100 px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2"
                    >
                      @if (admission()!.user) {
                        <span class="inline-flex items-center gap-1.5 text-xs text-slate-500">
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
                              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Registrado por:
                          <strong class="text-slate-700">{{ admission()!.user!.description }}</strong>
                        </span>
                      }
                      @if (admission()!.created_at) {
                        <span class="inline-flex items-center gap-1.5 text-xs text-slate-500">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {{ admission()!.created_at | date: 'dd/MM/yyyy HH:mm' }}
                        </span>
                      }
                    </div>
                  }
                </dd>
              </div>
            </dl>

          </section>

          <!-- ─── Alta Médica / Egreso ───────────────────────────────────── -->
          @if (admission()!.discharge) {
            <section
              class="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              aria-labelledby="section-discharge"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 id="section-discharge" class="text-base font-semibold text-emerald-800">
                    Esta admisión ya cuenta con un alta médica
                  </h2>
                  <p class="mt-0.5 text-sm text-emerald-600">
                    Puedes consultar el resumen, tratamiento y diagnósticos en su respectiva ficha.
                  </p>
                </div>
              </div>
              <a
                [routerLink]="['/discharges', admission()!.discharge!.id]"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Ver Ficha de Egreso
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </section>
          }
          <!-- ─── Motivo de Consulta ──────────────────────────────────────── -->
          <section
            class="rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="section-consult"
          >
            <div class="border-b border-slate-100 px-6 py-4">
              <h2
                id="section-consult"
                class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"
                  />
                </svg>
                Motivo de Consulta
              </h2>
            </div>
            <ul class="divide-y divide-slate-50 px-6 py-4" aria-label="Motivos de consulta">
              @for (reason of admission()!.consult_reason; track $index) {
                <li class="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span
                    class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1e3a5f]"
                    aria-hidden="true"
                  ></span>
                  <span class="text-sm text-slate-700">{{ reason }}</span>
                </li>
              }
            </ul>
          </section>

          <!-- ─── Antecedentes ───────────────────────────────────────────── -->
          <section
            class="rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="section-background"
          >
            <div class="border-b border-slate-100 px-6 py-4">
              <h2
                id="section-background"
                class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Antecedentes
              </h2>
            </div>
            <ul class="divide-y divide-slate-50 px-6 py-4" aria-label="Antecedentes del paciente">
              @for (bg of admission()!.background; track $index) {
                <li class="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span
                    class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400"
                    aria-hidden="true"
                  ></span>
                  <span class="text-sm text-slate-700">{{ bg }}</span>
                </li>
              }
            </ul>
          </section>

          <!-- ─── Condición Actual ───────────────────────────────────────── -->
          <section
            class="rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="section-condition"
          >
            <div class="border-b border-slate-100 px-6 py-4">
              <h2
                id="section-condition"
                class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Condición Actual
              </h2>
            </div>
            <div class="px-6 py-5">
              <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {{ admission()!.current_condition }}
              </p>
            </div>
          </section>

          <!-- ─── Examen de Admisión ─────────────────────────────────────── -->
          <section
            class="rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="section-exam"
          >
            <div class="border-b border-slate-100 px-6 py-4">
              <h2
                id="section-exam"
                class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Examen de Admisión
              </h2>
            </div>
            <div class="px-6 py-5">
              <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {{ admission()!.admission_exam }}
              </p>
            </div>
          </section>

          <!-- ─── Diagnósticos ───────────────────────────────────────────── -->
          <section
            class="rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="section-diagnoses"
          >
            <div class="border-b border-slate-100 px-6 py-4">
              <h2
                id="section-diagnoses"
                class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Diagnósticos CIE-11
                <span
                  class="ml-2 rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-xs font-semibold text-[#1e3a5f]"
                >
                  {{ admission()!.admission_diagnosis.length }}
                </span>
              </h2>
            </div>
            <div class="divide-y divide-slate-100">
              @for (diagnosis of admission()!.admission_diagnosis; track diagnosis.code) {
                <div class="px-6 py-4">
                  <div class="flex items-start gap-3">
                    <span
                      class="mt-0.5 flex-shrink-0 rounded bg-[#1e3a5f] px-2 py-0.5 font-mono text-xs font-bold text-white"
                    >
                      {{ diagnosis.code }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-slate-800">{{ diagnosis.title }}</p>
                      @if (diagnosis.description) {
                        <p class="mt-1 text-sm text-slate-600">{{ diagnosis.description }}</p>
                      }
                    </div>
                  </div>
                </div>
              }
              @if (admission()!.admission_diagnosis.length === 0) {
                <div class="px-6 py-6 text-center text-sm text-slate-400 italic">
                  No se registraron diagnósticos.
                </div>
              }
            </div>
          </section>

          <!-- ─── Notas de Evolución ─────────────────────────────────────── -->
          <section
            class="rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="section-evolutions"
          >
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2
                id="section-evolutions"
                class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Notas de Evolución
                <span
                  class="ml-2 rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-xs font-semibold text-[#1e3a5f]"
                >
                  {{ evolutions().length }}
                </span>
              </h2>
            </div>

            <!-- Evolutions loading -->
            @if (isLoadingEvolutions()) {
              <div class="flex items-center justify-center py-10" role="status" aria-live="polite">
                <svg
                  class="mr-2 h-5 w-5 animate-spin text-[#1e3a5f]"
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
                <span class="text-sm text-slate-500">Cargando evoluciones…</span>
              </div>
            }

            <!-- Evolution entries -->
            @if (!isLoadingEvolutions()) {
              <div class="divide-y divide-slate-50">
                @for (evo of evolutions(); track evo.id) {
                  <article
                    class="px-6 py-5"
                    [attr.aria-label]="
                      'Nota de evolución del ' + (evo.created_at | date: 'dd/MM/yyyy')
                    "
                  >
                    <div class="mb-3 flex items-start justify-between gap-3">
                      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <!-- Date badge -->
                        <span class="inline-flex items-center gap-1.5 text-xs text-slate-500">
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
                          {{ evo.date || evo.created_at | date: 'dd/MM/yyyy HH:mm' }}
                          @if (evo.updated_at && evo.updated_at !== evo.created_at) {
                            <span class="italic text-slate-400">(editado)</span>
                          }
                        </span>
                        <!-- Author badge -->
                        @if (evo.user) {
                          <span class="inline-flex items-center gap-1.5 text-xs text-slate-500">
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
                                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {{ evo.user.description }}
                          </span>
                        }
                      </div>
                      <div class="flex items-center gap-1">
                        <!-- Edit inline -->
                        @if (editingEvolutionId() !== evo.id) {
                          <button
                            type="button"
                            (click)="startEditEvolution(evo)"
                            class="rounded-md px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            [attr.aria-label]="'Editar nota de evolución'"
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
                          </button>
                          <button
                            type="button"
                            (click)="deleteEvolution(evo.id)"
                            class="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                            [attr.aria-label]="'Eliminar nota de evolución'"
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
                          </button>
                        }
                      </div>
                    </div>

                    <!-- View mode -->
                    @if (editingEvolutionId() !== evo.id) {
                      <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {{ evo.description }}
                      </p>
                    }

                    <!-- Edit mode inline -->
                    @if (editingEvolutionId() === evo.id) {
                      <div class="space-y-3">
                        <textarea
                          [(ngModel)]="editEvolutionText"
                          [name]="'edit-evo-' + evo.id"
                          rows="4"
                          class="w-full resize-none rounded-lg border border-[#1e3a5f] bg-blue-50/30 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                          [attr.aria-label]="'Editar nota de evolución'"
                        ></textarea>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            (click)="saveEvolution(evo.id)"
                            [disabled]="isSavingEvolution()"
                            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#16304f] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                          >
                            @if (isSavingEvolution()) {
                              <svg
                                class="h-3.5 w-3.5 animate-spin"
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
                                <path
                                  class="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8H4z"
                                />
                              </svg>
                            }
                            Guardar
                          </button>
                          <button
                            type="button"
                            (click)="cancelEditEvolution()"
                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    }
                  </article>
                }

                @if (evolutions().length === 0) {
                  <div class="px-6 py-8 text-center text-sm italic text-slate-400">
                    No hay notas de evolución registradas aún.
                  </div>
                }
              </div>

              <!-- Add new evolution -->
              <div class="border-t border-slate-100 bg-slate-50 px-6 py-5">
                <h3 class="mb-3 text-sm font-semibold text-slate-700">Agregar nota de evolución</h3>
                <div class="space-y-3">
                  <textarea
                    [(ngModel)]="newEvolutionText"
                    name="new-evolution"
                    rows="3"
                    placeholder="Escriba la nota de evolución del paciente..."
                    class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    aria-label="Nueva nota de evolución"
                  ></textarea>
                  @if (evolutionError()) {
                    <p class="text-xs text-red-600" role="alert">{{ evolutionError() }}</p>
                  }
                  <button
                    type="button"
                    (click)="addEvolution()"
                    [disabled]="isAddingEvolution() || !newEvolutionText.trim()"
                    class="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#16304f] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
                  >
                    @if (isAddingEvolution()) {
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
                      Guardando…
                    } @else {
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
                      Registrar Nota
                    }
                  </button>
                </div>
              </div>
            }
          </section>
        </div>
      }
    </div>
  `,
})
export class AdmissionDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly admissionsService = inject(AdmissionsService);
  private readonly evolutionsService = inject(EvolutionsService);
  private readonly destroy$ = new Subject<void>();

  // ── Admission state ───────────────────────────────────────────────────────
  readonly admission = signal<Admission | null>(null);
  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  // ── Evolutions state ──────────────────────────────────────────────────────
  readonly evolutions = signal<Evolution[]>([]);
  readonly isLoadingEvolutions = signal(false);

  // ── Document download state ───────────────────────────────────────────────
  readonly isDownloading = signal(false);

  // New evolution
  newEvolutionText = '';
  readonly isAddingEvolution = signal(false);
  readonly evolutionError = signal<string | null>(null);

  // Editing evolution inline
  readonly editingEvolutionId = signal<string | null>(null);
  editEvolutionText = '';
  readonly isSavingEvolution = signal(false);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMsg.set('ID de admisión no proporcionado.');
      return;
    }
    this.loadAdmission(id);
    this.loadEvolutions(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load admission ────────────────────────────────────────────────────────
  private loadAdmission(id: string): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.admissionsService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (admission) => {
          this.admission.set(admission);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set(err?.message ?? 'Error al cargar la admisión');
          this.isLoading.set(false);
        },
      });
  }

  // ── Load evolutions ───────────────────────────────────────────────────────
  private loadEvolutions(admissionId: string): void {
    this.isLoadingEvolutions.set(true);

    this.evolutionsService
      .getByAdmission(admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.evolutions.set(list);
          this.isLoadingEvolutions.set(false);
        },
        error: () => {
          // Non-critical — silently fail so admission info is still shown
          this.isLoadingEvolutions.set(false);
        },
      });
  }

  // ── Add evolution ─────────────────────────────────────────────────────────
  addEvolution(): void {
    const text = this.newEvolutionText.trim();
    if (!text || !this.admission()) return;

    this.evolutionError.set(null);
    this.isAddingEvolution.set(true);

    this.evolutionsService
      .create({
        admission_id: this.admission()!.id,
        description: text,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (evo) => {
          this.evolutions.update((list) => [evo, ...list]);
          this.newEvolutionText = '';
          this.isAddingEvolution.set(false);
        },
        error: (err: Error) => {
          this.evolutionError.set(err?.message ?? 'Error al guardar la evolución');
          this.isAddingEvolution.set(false);
        },
      });
  }

  // ── Inline edit evolution ─────────────────────────────────────────────────
  startEditEvolution(evo: Evolution): void {
    this.editingEvolutionId.set(evo.id);
    this.editEvolutionText = evo.description;
  }

  cancelEditEvolution(): void {
    this.editingEvolutionId.set(null);
    this.editEvolutionText = '';
  }

  saveEvolution(id: string): void {
    const text = this.editEvolutionText.trim();
    if (!text) return;
    const currentAdmission = this.admission();

    this.isSavingEvolution.set(true);

    this.evolutionsService
      .update(id, { description: text })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_) => {
          if (currentAdmission && currentAdmission.id) this.loadEvolutions(currentAdmission.id);
          this.editingEvolutionId.set(null);
          this.editEvolutionText = '';
          this.isSavingEvolution.set(false);
        },
        error: () => {
          this.isSavingEvolution.set(false);
        },
      });
  }

  // ── Delete evolution ──────────────────────────────────────────────────────
  deleteEvolution(id: string): void {
    if (!confirm('¿Eliminar esta nota de evolución?')) return;

    this.evolutionsService
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.evolutions.update((list) => list.filter((e) => e.id !== id));
        },
        error: () => {
          // Silent fail — could show toast in production
        },
      });
  }

  // ── Download document ─────────────────────────────────────────────────────
  downloadPdf(): void {
    const currentAdmission = this.admission();
    if (!currentAdmission) return;

    this.isDownloading.set(true);

    this.admissionsService.downloadDocument(currentAdmission.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admission_${currentAdmission.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading.set(false);
      },
      error: () => {
        console.error('Error downloading document');
        this.isDownloading.set(false);
      },
    });
  }
}
