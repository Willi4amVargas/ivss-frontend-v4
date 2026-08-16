import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { AdmissionsService } from '../../../core/services/clinical-records.service';
import { DiagnosticsService } from '../../../core/services/diagnostics.service';
import {
  Admission,
  CreateAdmissionDto,
  Diagnosis,
  DiagnosisSearchResult,
} from '../../../core/models';

// ── Validator: min-length for FormArrays ─────────────────────────────────────
function minLengthArray(min: number) {
  return (control: AbstractControl) => {
    const arr = control as FormArray;
    return arr.length >= min ? null : { minLengthArray: { requiredLength: min, actualLength: arr.length } };
  };
}

@Component({
  selector: 'app-admission-form',
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

      <!-- Page Header -->
      <div class="mb-8 flex items-center gap-4">
        <button
          type="button"
          (click)="cancel()"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          aria-label="Volver atrás"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">
            {{ isEditMode() ? 'Editar Admisión' : 'Nueva Admisión' }}
          </h1>
          <p class="mt-0.5 text-sm text-slate-500">
            {{ isEditMode() ? 'Modifica los datos de la admisión' : 'Registra una nueva admisión hospitalaria' }}
          </p>
        </div>
      </div>

      <!-- Loading skeleton for edit mode -->
      @if (isLoadingAdmission()) {
        <div class="space-y-6" role="status" aria-label="Cargando admisión">
          @for (_ of [1,2,3]; track $index) {
            <div class="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <div class="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200"></div>
              <div class="space-y-3">
                <div class="h-10 w-full animate-pulse rounded-lg bg-slate-100"></div>
                <div class="h-10 w-3/4 animate-pulse rounded-lg bg-slate-100"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error loading -->
      @if (!isLoadingAdmission() && loadError()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <p class="text-sm font-semibold text-red-700">Error al cargar la admisión</p>
          <p class="mt-1 text-xs text-red-600">{{ loadError() }}</p>
        </div>
      }

      <!-- Form -->
      @if (!isLoadingAdmission() && !loadError()) {
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
          class="space-y-6"
          aria-label="Formulario de admisión"
        >

          <!-- ─── Section: Datos generales ──────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="section-general">
            <div class="border-b border-slate-100 px-6 py-4">
              <h2 id="section-general" class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Datos Generales
              </h2>
            </div>
            <div class="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <!-- Patient ID -->
              <div class="flex flex-col gap-1.5">
                <label for="patient_id" class="text-sm font-medium text-slate-700">
                  ID del Paciente <span class="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="patient_id"
                  type="text"
                  formControlName="patient_id"
                  placeholder="UUID del paciente"
                  autocomplete="off"
                  class="rounded-lg border px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  [class.border-slate-300]="!isFieldInvalid('patient_id')"
                  [class.border-red-400]="isFieldInvalid('patient_id')"
                  [class.bg-red-50]="isFieldInvalid('patient_id')"
                  aria-required="true"
                  [attr.aria-invalid]="isFieldInvalid('patient_id')"
                  aria-describedby="patient_id-error"
                />
                @if (isFieldInvalid('patient_id')) {
                  <p id="patient_id-error" class="text-xs text-red-600" role="alert">
                    El ID del paciente es requerido.
                  </p>
                }
              </div>

              <!-- Admission Date -->
              <div class="flex flex-col gap-1.5">
                <label for="admission_date" class="text-sm font-medium text-slate-700">
                  Fecha de Admisión
                </label>
                <input
                  id="admission_date"
                  type="datetime-local"
                  formControlName="admission_date"
                  class="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
            </div>
          </section>

          <!-- ─── Section: Motivo de Consulta ──────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="section-consult">
            <div class="border-b border-slate-100 px-6 py-4">
              <h2 id="section-consult" class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                </svg>
                Motivo de Consulta
                <span class="ml-auto text-xs font-normal text-slate-400">(mínimo 1)</span>
              </h2>
            </div>
            <div class="p-6 space-y-3" formArrayName="consult_reason">
              @for (ctrl of consultReasonArray.controls; track $index) {
                <div class="flex items-center gap-2">
                  <input
                    [formControlName]="$index"
                    type="text"
                    [placeholder]="'Motivo ' + ($index + 1)"
                    class="flex-1 rounded-lg border px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    [class.border-slate-300]="!isArrayItemInvalid(consultReasonArray, $index)"
                    [class.border-red-400]="isArrayItemInvalid(consultReasonArray, $index)"
                    [attr.aria-label]="'Motivo de consulta ' + ($index + 1)"
                    [attr.aria-required]="$index === 0"
                  />
                  @if (consultReasonArray.length > 1) {
                    <button
                      type="button"
                      (click)="removeConsultReason($index)"
                      class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                      [attr.aria-label]="'Eliminar motivo ' + ($index + 1)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  }
                </div>
              }
              <button
                type="button"
                (click)="addConsultReason()"
                class="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Agregar motivo
              </button>
              @if (submitted() && consultReasonArray.invalid) {
                <p class="text-xs text-red-600" role="alert">Se requiere al menos un motivo de consulta.</p>
              }
            </div>
          </section>

          <!-- ─── Section: Condición Actual ────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="section-condition">
            <div class="border-b border-slate-100 px-6 py-4">
              <h2 id="section-condition" class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Condición Actual
              </h2>
            </div>
            <div class="p-6">
              <label for="current_condition" class="mb-1.5 block text-sm font-medium text-slate-700">
                Descripción de la condición actual <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <textarea
                id="current_condition"
                formControlName="current_condition"
                rows="4"
                placeholder="Describa detalladamente la condición actual del paciente..."
                class="w-full resize-none rounded-lg border px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                [class.border-slate-300]="!isFieldInvalid('current_condition')"
                [class.border-red-400]="isFieldInvalid('current_condition')"
                aria-required="true"
                [attr.aria-invalid]="isFieldInvalid('current_condition')"
                aria-describedby="current_condition-error"
              ></textarea>
              @if (isFieldInvalid('current_condition')) {
                <p id="current_condition-error" class="mt-1 text-xs text-red-600" role="alert">
                  La condición actual es requerida.
                </p>
              }
            </div>
          </section>

          <!-- ─── Section: Antecedentes ────────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="section-background">
            <div class="border-b border-slate-100 px-6 py-4">
              <h2 id="section-background" class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Antecedentes
                <span class="ml-auto text-xs font-normal text-slate-400">(mínimo 1)</span>
              </h2>
            </div>
            <div class="p-6 space-y-3" formArrayName="background">
              @for (ctrl of backgroundArray.controls; track $index) {
                <div class="flex items-center gap-2">
                  <input
                    [formControlName]="$index"
                    type="text"
                    [placeholder]="'Antecedente ' + ($index + 1)"
                    class="flex-1 rounded-lg border px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    [class.border-slate-300]="!isArrayItemInvalid(backgroundArray, $index)"
                    [class.border-red-400]="isArrayItemInvalid(backgroundArray, $index)"
                    [attr.aria-label]="'Antecedente ' + ($index + 1)"
                    [attr.aria-required]="$index === 0"
                  />
                  @if (backgroundArray.length > 1) {
                    <button
                      type="button"
                      (click)="removeBackground($index)"
                      class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                      [attr.aria-label]="'Eliminar antecedente ' + ($index + 1)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  }
                </div>
              }
              <button
                type="button"
                (click)="addBackground()"
                class="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Agregar antecedente
              </button>
              @if (submitted() && backgroundArray.invalid) {
                <p class="text-xs text-red-600" role="alert">Se requiere al menos un antecedente.</p>
              }
            </div>
          </section>

          <!-- ─── Section: Examen de Admisión ──────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="section-exam">
            <div class="border-b border-slate-100 px-6 py-4">
              <h2 id="section-exam" class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
                Examen de Admisión
              </h2>
            </div>
            <div class="p-6">
              <label for="admission_exam" class="mb-1.5 block text-sm font-medium text-slate-700">
                Resultados del examen físico <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <textarea
                id="admission_exam"
                formControlName="admission_exam"
                rows="4"
                placeholder="Registre los resultados del examen de admisión..."
                class="w-full resize-none rounded-lg border px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                [class.border-slate-300]="!isFieldInvalid('admission_exam')"
                [class.border-red-400]="isFieldInvalid('admission_exam')"
                aria-required="true"
                [attr.aria-invalid]="isFieldInvalid('admission_exam')"
                aria-describedby="admission_exam-error"
              ></textarea>
              @if (isFieldInvalid('admission_exam')) {
                <p id="admission_exam-error" class="mt-1 text-xs text-red-600" role="alert">
                  El examen de admisión es requerido.
                </p>
              }
            </div>
          </section>

          <!-- ─── Section: Diagnósticos ─────────────────────────────────────── -->
          <section class="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="section-diagnoses">
            <div class="border-b border-slate-100 px-6 py-4">
              <h2 id="section-diagnoses" class="flex items-center gap-2 text-base font-semibold text-[#1e3a5f]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                Diagnósticos CIE-11
                <span class="ml-auto text-xs font-normal text-slate-400">(mínimo 1)</span>
              </h2>
            </div>
            <div class="p-6 space-y-4">

              <!-- Diagnosis Search -->
              <div class="relative">
                <label for="diagnosis-search" class="mb-1.5 block text-sm font-medium text-slate-700">
                  Buscar diagnóstico CIE-11
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    @if (isSearching()) {
                      <svg class="h-4 w-4 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    }
                  </div>
                  <input
                    id="diagnosis-search"
                    type="text"
                    [value]="searchQuery()"
                    (input)="onSearchInput($event)"
                    (focus)="showDropdown.set(true)"
                    placeholder="Escriba para buscar (ej. hipertensión, diabetes...)"
                    class="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    role="combobox"
                    aria-haspopup="listbox"
                    [attr.aria-expanded]="showDropdown() && searchResults().length > 0"
                    aria-autocomplete="list"
                    aria-controls="diagnosis-dropdown"
                  />
                </div>

                <!-- Search Results Dropdown -->
                @if (showDropdown() && searchResults().length > 0) {
                  <ul
                    id="diagnosis-dropdown"
                    role="listbox"
                    aria-label="Resultados de búsqueda CIE-11"
                    class="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
                  >
                    @for (result of searchResults(); track result.code) {
                      <li role="option" [attr.aria-selected]="false">
                        <button
                          type="button"
                          (click)="selectDiagnosis(result)"
                          class="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-blue-50 focus:outline-none focus:bg-blue-50"
                        >
                          <span class="mt-0.5 flex-shrink-0 rounded bg-[#1e3a5f]/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-[#1e3a5f]">
                            {{ result.code }}
                          </span>
                          <span class="text-slate-700">{{ result.title }}</span>
                        </button>
                      </li>
                    }
                  </ul>
                }

                <!-- No results -->
                @if (showDropdown() && searchQuery().length >= 2 && !isSearching() && searchResults().length === 0) {
                  <div class="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
                    No se encontraron diagnósticos para "{{ searchQuery() }}"
                  </div>
                }
              </div>

              <!-- Selected Diagnoses -->
              @if (diagnosesArray.length === 0) {
                <div class="rounded-lg border-2 border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                  Sin diagnósticos seleccionados. Busque y seleccione al menos uno.
                </div>
              } @else {
                <div class="space-y-3" formArrayName="diagnoses">
                  @for (diagCtrl of diagnosesArray.controls; track $index) {
                    <div
                      [formGroupName]="$index"
                      class="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div class="mb-3 flex items-start justify-between gap-3">
                        <div class="flex items-center gap-2">
                          <span class="rounded bg-[#1e3a5f] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                            {{ diagCtrl.get('code')?.value }}
                          </span>
                          <span class="text-sm font-medium text-slate-800">
                            {{ diagCtrl.get('title')?.value }}
                          </span>
                        </div>
                        <button
                          type="button"
                          (click)="removeDiagnosis($index)"
                          class="flex-shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-red-100 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                          [attr.aria-label]="'Eliminar diagnóstico ' + diagCtrl.get('code')?.value"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                      <!-- Hidden code & title -->
                      <input type="hidden" formControlName="code" />
                      <input type="hidden" formControlName="title" />
                      <!-- Optional description -->
                      <div class="flex flex-col gap-1">
                        <label [for]="'diag-desc-' + $index" class="text-xs font-medium text-slate-500">
                          Descripción clínica (opcional)
                        </label>
                        <textarea
                          [id]="'diag-desc-' + $index"
                          formControlName="description"
                          rows="2"
                          placeholder="Observaciones adicionales sobre este diagnóstico..."
                          class="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                        ></textarea>
                      </div>
                    </div>
                  }
                </div>
              }

              @if (submitted() && diagnosesArray.length === 0) {
                <p class="text-xs text-red-600" role="alert">Se requiere al menos un diagnóstico.</p>
              }
            </div>
          </section>

          <!-- ─── Submit / Cancel ───────────────────────────────────────────── -->
          <div class="flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            @if (submitError()) {
              <p class="mr-auto text-sm text-red-600" role="alert">{{ submitError() }}</p>
            }
            <button
              type="button"
              (click)="cancel()"
              class="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16304f] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2"
            >
              @if (isSubmitting()) {
                <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ isEditMode() ? 'Guardando…' : 'Creando…' }}
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                {{ isEditMode() ? 'Guardar Cambios' : 'Registrar Admisión' }}
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class AdmissionFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly admissionsService = inject(AdmissionsService);
  private readonly diagnosticsService = inject(DiagnosticsService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // ── State signals ─────────────────────────────────────────────────────────
  readonly isEditMode = signal(false);
  readonly admissionId = signal<string | null>(null);
  readonly isLoadingAdmission = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);

  // Diagnosis search
  readonly searchQuery = signal('');
  readonly searchResults = signal<DiagnosisSearchResult[]>([]);
  readonly isSearching = signal(false);
  readonly showDropdown = signal(false);

  // ── Form ─────────────────────────────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    patient_id: ['', [Validators.required, Validators.minLength(1)]],
    admission_date: [''],
    consult_reason: this.fb.array(
      [this.fb.control('', Validators.required)],
      [minLengthArray(1)],
    ),
    current_condition: ['', Validators.required],
    background: this.fb.array(
      [this.fb.control('', Validators.required)],
      [minLengthArray(1)],
    ),
    admission_exam: ['', Validators.required],
    diagnoses: this.fb.array([]),
  });

  get consultReasonArray(): FormArray {
    return this.form.get('consult_reason') as FormArray;
  }

  get backgroundArray(): FormArray {
    return this.form.get('background') as FormArray;
  }

  get diagnosesArray(): FormArray {
    return this.form.get('diagnoses') as FormArray;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.setupSearchDebounce();

    const id = this.route.snapshot.paramMap.get('id');
    const patientQp = this.route.snapshot.queryParamMap.get('patient_id');

    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.admissionId.set(id);
      this.loadAdmission(id);
    } else {
      // Pre-fill patient_id from query param if navigated from patient detail
      if (patientQp) {
        this.form.get('patient_id')?.setValue(patientQp);
      }
    }

    // Close dropdown on outside click
    document.addEventListener('click', this.handleOutsideClick);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  private readonly handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[aria-controls="diagnosis-dropdown"]') && !target.closest('#diagnosis-dropdown')) {
      this.showDropdown.set(false);
    }
  };

  // ── Setup search debounce ─────────────────────────────────────────────────
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.length < 2) {
          this.searchResults.set([]);
          this.isSearching.set(false);
          return of([]);
        }
        this.isSearching.set(true);
        return this.diagnosticsService.search(query);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      },
      error: () => {
        this.searchResults.set([]);
        this.isSearching.set(false);
      },
    });
  }

  // ── Load admission for edit ───────────────────────────────────────────────
  private loadAdmission(id: string): void {
    this.isLoadingAdmission.set(true);
    this.loadError.set(null);

    this.admissionsService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (admission) => {
        this.populateForm(admission);
        this.isLoadingAdmission.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err?.message ?? 'Error al cargar la admisión');
        this.isLoadingAdmission.set(false);
      },
    });
  }

  private populateForm(admission: Admission): void {
    // Reset arrays
    this.consultReasonArray.clear();
    this.backgroundArray.clear();
    this.diagnosesArray.clear();

    this.form.patchValue({
      patient_id: admission.patient_id,
      admission_date: admission.admission_date
        ? admission.admission_date.slice(0, 16)
        : '',
      current_condition: admission.current_condition,
      admission_exam: admission.admission_exam,
    });

    admission.consult_reason.forEach((r) =>
      this.consultReasonArray.push(this.fb.control(r, Validators.required)),
    );
    if (this.consultReasonArray.length === 0) {
      this.addConsultReason();
    }

    admission.background.forEach((b) =>
      this.backgroundArray.push(this.fb.control(b, Validators.required)),
    );
    if (this.backgroundArray.length === 0) {
      this.addBackground();
    }

    admission.admission_diagnosis.forEach((d) => this.pushDiagnosisGroup(d));
  }

  // ── Array helpers ─────────────────────────────────────────────────────────
  addConsultReason(): void {
    this.consultReasonArray.push(this.fb.control('', Validators.required));
  }

  removeConsultReason(index: number): void {
    if (this.consultReasonArray.length > 1) {
      this.consultReasonArray.removeAt(index);
    }
  }

  addBackground(): void {
    this.backgroundArray.push(this.fb.control('', Validators.required));
  }

  removeBackground(index: number): void {
    if (this.backgroundArray.length > 1) {
      this.backgroundArray.removeAt(index);
    }
  }

  private pushDiagnosisGroup(diagnosis: Partial<Diagnosis> = {}): void {
    this.diagnosesArray.push(
      this.fb.group({
        code: [diagnosis.code ?? ''],
        title: [diagnosis.title ?? ''],
        description: [diagnosis.description ?? ''],
      }),
    );
  }

  removeDiagnosis(index: number): void {
    this.diagnosesArray.removeAt(index);
  }

  // ── Diagnosis search ──────────────────────────────────────────────────────
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.showDropdown.set(true);
    this.searchSubject.next(query);
  }

  selectDiagnosis(result: DiagnosisSearchResult): void {
    // Avoid duplicates
    const alreadyAdded = this.diagnosesArray.controls.some(
      (ctrl) => ctrl.get('code')?.value === result.code,
    );
    if (!alreadyAdded) {
      this.pushDiagnosisGroup({ code: result.code, title: result.title });
    }
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showDropdown.set(false);
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted());
  }

  isArrayItemInvalid(arr: FormArray, index: number): boolean {
    const ctrl = arr.at(index);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted());
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  submit(): void {
    this.submitted.set(true);
    this.submitError.set(null);

    // Manual validation for diagnoses (FormArray not touched by user interaction)
    if (this.form.invalid || this.diagnosesArray.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateAdmissionDto = {
      patient_id: raw['patient_id'],
      admission_date: raw['admission_date'] || undefined,
      consult_reason: (raw['consult_reason'] as string[]).filter((s: string) => s.trim()),
      current_condition: raw['current_condition'],
      background: (raw['background'] as string[]).filter((s: string) => s.trim()),
      admission_exam: raw['admission_exam'],
      diagnoses: raw['diagnoses'] as Diagnosis[],
    };

    this.isSubmitting.set(true);

    const request$ = this.isEditMode()
      ? this.admissionsService.update(this.admissionId()!, dto)
      : this.admissionsService.create(dto);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/admissions']);
      },
      error: (err: Error) => {
        this.submitError.set(err?.message ?? 'Error al guardar la admisión');
        this.isSubmitting.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admissions']);
  }
}
