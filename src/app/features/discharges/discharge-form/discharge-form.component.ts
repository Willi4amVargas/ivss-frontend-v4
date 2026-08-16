import { Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { DischargesService } from '../../../core/services/clinical-records.service';
import { DiagnosticsService } from '../../../core/services/diagnostics.service';
import { CreateDischargeDto, UpdateDischargeDto, DiagnosisSearchResult } from '../../../core/models';
import { ApiError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-discharge-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-3xl mx-auto animate-fade-in">
      <!-- Header -->
      <div class="mb-6">
        <a routerLink="/discharges" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver a Egresos
        </a>
        <h1 class="text-2xl font-semibold text-slate-800">
          {{ isEditMode() ? 'Editar Egreso' : 'Registrar Egreso' }}
        </h1>
        <p class="text-sm text-slate-500 mt-0.5">
          {{ isEditMode() ? 'Modifique los datos del egreso médico' : 'Complete los campos para registrar el alta médica' }}
        </p>
      </div>

      <!-- Error Banner -->
      @if (submitError()) {
        <div role="alert" aria-live="assertive" class="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          {{ submitError() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <!-- Card: Datos Básicos -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <h2 class="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            Datos de Egreso
          </h2>

          <!-- admission_id -->
          <div class="mb-4">
            <label for="admission_id" class="block text-sm font-medium text-slate-700 mb-1.5">
              ID de Admisión <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="admission_id"
              type="text"
              formControlName="admission_id"
              placeholder="UUID de la admisión a dar de alta"
              class="w-full px-3 py-2 rounded-lg border text-sm font-mono transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500
                {{ isInvalid('admission_id') ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white' }}"
              [attr.aria-invalid]="isInvalid('admission_id')"
              aria-describedby="admission_id_error"
            >
            @if (isInvalid('admission_id')) {
              <p id="admission_id_error" class="mt-1 text-xs text-red-600" role="alert">
                El ID de admisión es obligatorio.
              </p>
            }
          </div>

          <!-- discharge_date -->
          <div class="mb-4">
            <label for="discharge_date" class="block text-sm font-medium text-slate-700 mb-1.5">
              Fecha y Hora de Egreso
            </label>
            <input
              id="discharge_date"
              type="datetime-local"
              formControlName="discharge_date"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
          </div>

          <!-- morbility_status -->
          <div class="mb-4 flex items-center gap-3">
            <input
              id="morbility_status"
              type="checkbox"
              formControlName="morbility_status"
              class="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            >
            <label for="morbility_status" class="text-sm font-medium text-slate-700">
              Egreso por Fallecimiento (morbilidad)
            </label>
          </div>
        </div>

        <!-- Card: Examen de Egreso -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <h2 class="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            Examen Físico de Egreso
          </h2>
          <div>
            <label for="discharge_exam" class="block text-sm font-medium text-slate-700 mb-1.5">
              Detalles del examen físico <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="discharge_exam"
              formControlName="discharge_exam"
              rows="4"
              placeholder="Campos pulmonares limpios, ruidos cardíacos rítmicos..."
              class="w-full px-3 py-2 rounded-lg border text-sm resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500
                {{ isInvalid('discharge_exam') ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white' }}"
              [attr.aria-invalid]="isInvalid('discharge_exam')"
              aria-describedby="discharge_exam_error"
            ></textarea>
            @if (isInvalid('discharge_exam')) {
              <p id="discharge_exam_error" class="mt-1 text-xs text-red-600" role="alert">
                El examen de egreso es obligatorio.
              </p>
            }
          </div>
        </div>

        <!-- Card: Plan Terapéutico -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <h2 class="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            Plan Terapéutico Post-Hospitalización
          </h2>
          <div>
            <label for="treatment_plan" class="block text-sm font-medium text-slate-700 mb-1.5">
              Indicaciones y tratamiento
            </label>
            <textarea
              id="treatment_plan"
              formControlName="treatment_plan"
              rows="4"
              placeholder="Amoxicilina 500mg VO cada 8 horas por 7 días..."
              class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            ></textarea>
          </div>
        </div>

        <!-- Card: Diagnósticos CIE-11 -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 class="text-base font-semibold text-slate-700 mb-1 pb-2 border-b border-slate-100">
            Diagnósticos de Egreso <span class="text-red-500" aria-hidden="true">*</span>
          </h2>
          <p class="text-xs text-slate-500 mb-4">Busque y agregue al menos un diagnóstico CIE-11</p>

          <!-- Search input -->
          <div class="relative mb-3">
            <label for="diag_search" class="block text-sm font-medium text-slate-700 mb-1.5">
              Buscar diagnóstico
            </label>
            <div class="relative">
              <input
                id="diag_search"
                type="text"
                [value]="diagSearchQuery()"
                (input)="onDiagSearch($event)"
                placeholder="Ej: neumonía, diabetes, hipertensión..."
                class="w-full px-3 py-2 pr-8 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                [attr.aria-expanded]="diagResults().length > 0"
                aria-autocomplete="list"
                aria-controls="diag_results"
                role="combobox"
              >
              @if (diagLoading()) {
                <svg class="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              }
            </div>

            <!-- Results dropdown -->
            @if (diagResults().length > 0) {
              <ul
                id="diag_results"
                role="listbox"
                aria-label="Resultados de diagnósticos CIE-11"
                class="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto"
              >
                @for (result of diagResults(); track result.code) {
                  <li
                    role="option"
                    [attr.aria-selected]="false"
                    (click)="addDiagnosis(result)"
                    (keydown.enter)="addDiagnosis(result)"
                    tabindex="0"
                    class="px-4 py-2.5 hover:bg-primary-50 cursor-pointer flex items-start gap-2 text-sm border-b border-slate-50 last:border-0"
                  >
                    <span class="inline-flex shrink-0 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-xs font-medium mt-0.5">
                      {{ result.code }}
                    </span>
                    <span class="text-slate-700">{{ result.title }}</span>
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Selected diagnoses -->
          <div formArrayName="diagnoses" class="space-y-2">
            @for (diag of diagnosesArray.controls; track $index; let i = $index) {
              <div [formGroupName]="i" class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="inline-flex px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-xs font-medium">
                      {{ diag.get('code')?.value }}
                    </span>
                    <span class="text-sm font-medium text-slate-700 truncate">{{ diag.get('title')?.value }}</span>
                  </div>
                  <input
                    type="text"
                    formControlName="description"
                    placeholder="Descripción adicional (opcional)"
                    [attr.aria-label]="'Descripción del diagnóstico ' + diag.get('code')?.value"
                    class="w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  >
                </div>
                <button
                  type="button"
                  (click)="removeDiagnosis(i)"
                  class="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 mt-0.5"
                  [attr.aria-label]="'Eliminar diagnóstico ' + diag.get('code')?.value"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }

            @if (diagnosesArray.controls.length === 0) {
              <p class="text-sm text-slate-400 italic text-center py-4">
                No se han agregado diagnósticos aún.
              </p>
            }
          </div>

          @if (submitted() && diagnosesArray.length === 0) {
            <p class="mt-2 text-xs text-red-600" role="alert">
              Debe agregar al menos un diagnóstico de egreso.
            </p>
          }
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 justify-end">
          <a
            routerLink="/discharges"
            class="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </a>
          <button
            type="submit"
            [disabled]="submitting()"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-900 text-white text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            @if (submitting()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Guardando...
            } @else {
              {{ isEditMode() ? 'Guardar Cambios' : 'Registrar Egreso' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class DischargeFormComponent implements OnInit {
  private readonly svc = inject(DischargesService);
  private readonly diagSvc = inject(DiagnosticsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly id = input<string | undefined>(undefined);

  readonly isEditMode = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly diagSearchQuery = signal('');
  readonly diagResults = signal<DiagnosisSearchResult[]>([]);
  readonly diagLoading = signal(false);

  private readonly diagSearch$ = new Subject<string>();

  form: FormGroup = this.fb.group({
    admission_id: ['', Validators.required],
    discharge_date: [''],
    morbility_status: [false],
    discharge_exam: ['', Validators.required],
    treatment_plan: [''],
    diagnoses: this.fb.array([]),
  });

  get diagnosesArray(): FormArray {
    return this.form.get('diagnoses') as FormArray;
  }

  ngOnInit(): void {
    // Pre-fill admission_id from queryParam
    const qAdmissionId = this.route.snapshot.queryParamMap.get('admission_id');
    if (qAdmissionId) {
      this.form.patchValue({ admission_id: qAdmissionId });
    }

    // Determine edit mode from route param
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.isEditMode.set(true);
      this.loadDischarge(routeId);
    }

    // Diagnosis search with debounce
    this.diagSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.length < 2) {
            this.diagResults.set([]);
            this.diagLoading.set(false);
            return of([]);
          }
          this.diagLoading.set(true);
          return this.diagSvc.search(q).pipe(catchError(() => of([])));
        }),
      )
      .subscribe((results) => {
        this.diagResults.set(results as DiagnosisSearchResult[]);
        this.diagLoading.set(false);
      });
  }

  private loadDischarge(id: string): void {
    this.svc.getById(id).subscribe({
      next: (d) => {
        this.form.patchValue({
          admission_id: d.admission_id,
          discharge_date: d.discharge_date ? d.discharge_date.slice(0, 16) : '',
          morbility_status: d.morbility_status ?? false,
          discharge_exam: d.discharge_exam,
          treatment_plan: d.treatment_plan ?? '',
        });
        d.discharges_diagnosis.forEach((diag) =>
          this.diagnosesArray.push(
            this.fb.group({ id: [diag.id], code: [diag.code], title: [diag.title], description: [diag.description ?? ''] }),
          ),
        );
      },
      error: (err: ApiError) => {
        this.submitError.set(err.message);
      },
    });
  }

  onDiagSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.diagSearchQuery.set(q);
    this.diagSearch$.next(q);
  }

  addDiagnosis(result: DiagnosisSearchResult): void {
    this.diagnosesArray.push(
      this.fb.group({ code: [result.code], title: [result.title], description: [''] }),
    );
    this.diagResults.set([]);
    this.diagSearchQuery.set('');
  }

  removeDiagnosis(index: number): void {
    this.diagnosesArray.removeAt(index);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.submitted());
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.diagnosesArray.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const routeId = this.route.snapshot.paramMap.get('id');
    const raw = this.form.getRawValue();
    const dto: CreateDischargeDto = {
      admission_id: raw.admission_id,
      discharge_date: raw.discharge_date || undefined,
      morbility_status: raw.morbility_status,
      discharge_exam: raw.discharge_exam,
      treatment_plan: raw.treatment_plan || undefined,
      diagnoses: raw.diagnoses,
    };

    const req$ = routeId
      ? this.svc.update(routeId, dto as UpdateDischargeDto)
      : this.svc.create(dto);

    req$.subscribe({
      next: () => this.router.navigate(['/discharges']),
      error: (err: ApiError) => {
        this.submitError.set(err.message);
        this.submitting.set(false);
      },
    });
  }
}
