import { Component, OnInit, inject, signal, input } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import {
  DischargesService,
  AdmissionsService,
} from '../../../core/services/clinical-records.service';
import { DiagnosticsService } from '../../../core/services/diagnostics.service';
import {
  CreateDischargeDto,
  UpdateDischargeDto,
  DiagnosisSearchResult,
  Admission,
} from '../../../core/models';
import { ApiError } from '../../../core/interceptors/error.interceptor';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-discharge-form',
  imports: [ReactiveFormsModule, RouterLink, SlicePipe],
  templateUrl: './discharge-form.component.html',
})
export class DischargeFormComponent implements OnInit {
  private readonly svc = inject(DischargesService);
  private readonly admissionsSvc = inject(AdmissionsService);
  private readonly diagSvc = inject(DiagnosticsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly id = input<string | undefined>(undefined);

  readonly isEditMode = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);

  // Active Admissions logic
  readonly activeAdmissions = signal<Admission[]>([]);
  readonly activeAdmissionsLoading = signal(false);
  readonly showAdmissionsDropdown = signal(false);
  readonly selectedAdmission = signal<Admission | null>(null);

  // Diagnoses logic
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
      this.loadSingleAdmission(qAdmissionId);
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

  // --- Admissions Dropdown ---

  loadActiveAdmissions(): void {
    if (this.activeAdmissions().length > 0) {
      this.showAdmissionsDropdown.set(true);
      return;
    }

    this.activeAdmissionsLoading.set(true);
    this.showAdmissionsDropdown.set(true);

    this.admissionsSvc
      .getAll({
        page: 1,
        limit: 20,
        status: 'active',
      })
      .subscribe({
        next: (data) => {
          this.activeAdmissions.set(data.data);
          this.activeAdmissionsLoading.set(false);
        },
        error: () => {
          this.activeAdmissionsLoading.set(false);
        },
      });
  }

  hideDropdownWithDelay(): void {
    setTimeout(() => {
      this.showAdmissionsDropdown.set(false);
    }, 200);
  }

  selectAdmission(adm: Admission): void {
    this.selectedAdmission.set(adm);
    this.form.patchValue({ admission_id: adm.id });
    this.showAdmissionsDropdown.set(false);
  }

  clearSelectedAdmission(): void {
    this.selectedAdmission.set(null);
    this.form.patchValue({ admission_id: '' });
    // setTimeout to ensure focus is restored and dropdown triggers correctly
    setTimeout(() => {
      this.loadActiveAdmissions();
    }, 50);
  }

  private loadSingleAdmission(admissionId: string): void {
    this.admissionsSvc.getById(admissionId).subscribe({
      next: (adm) => {
        this.selectedAdmission.set(adm);
      },
      error: () => {}, // Silent fail, we still have the ID in the form
    });
  }

  // --- Discharge Data Load ---

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

        // Also load the admission object to display it in the dropdown badge
        this.loadSingleAdmission(d.admission_id);

        d.discharges_diagnosis.forEach((diag) =>
          this.diagnosesArray.push(
            this.fb.group({
              id: [diag.id],
              code: [diag.code],
              title: [diag.title],
              description: [diag.description ?? ''],
            }),
          ),
        );
      },
      error: (err: ApiError) => {
        this.submitError.set(err.message);
      },
    });
  }

  // --- Diagnoses ---

  onDiagSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.diagSearchQuery.set(q);
    this.diagSearch$.next(q);
  }

  addFreeTextDiagnosis(): void {
    const text = this.diagSearchQuery().trim();
    if (!text) return;

    this.diagnosesArray.push(this.fb.group({ code: ['TXT'], title: [text], description: [''] }));
    this.diagResults.set([]);
    this.diagSearchQuery.set('');
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

  // --- Form Helpers ---

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
      next: (data) => {
        this.router.navigate(['/discharges', data.id || routeId]);
      },
      error: (err: ApiError) => {
        this.submitError.set(err.message);
        this.submitting.set(false);
      },
    });
  }
}
