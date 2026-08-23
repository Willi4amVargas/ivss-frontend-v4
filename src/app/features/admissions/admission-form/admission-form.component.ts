import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  takeUntil,
  finalize,
} from 'rxjs';
import { AdmissionsService } from '../../../core/services/clinical-records.service';
import { DiagnosticsService } from '../../../core/services/diagnostics.service';
import { PatientsService } from '../../../core/services/patients.service';
import {
  Admission,
  CreateAdmissionDto,
  Diagnosis,
  DiagnosisSearchResult,
  Patient,
} from '../../../core/models';

// ── Validator: min-length for FormArrays ─────────────────────────────────────
function minLengthArray(min: number) {
  return (control: AbstractControl) => {
    const arr = control as FormArray;
    return arr.length >= min
      ? null
      : { minLengthArray: { requiredLength: min, actualLength: arr.length } };
  };
}

@Component({
  selector: 'app-admission-form',
  imports: [ReactiveFormsModule],
  templateUrl: './admission-form-component.html',
})
export class AdmissionFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly admissionsService = inject(AdmissionsService);
  private readonly diagnosticsService = inject(DiagnosticsService);
  private readonly patientsService = inject(PatientsService);

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
  readonly deletingDiagnosis = signal(false);

  // Patient search state
  readonly allPatients = signal<Patient[]>([]);
  readonly patientSearchQuery = signal('');
  readonly showPatientDropdown = signal(false);
  readonly selectedPatient = signal<Patient | null>(null);

  // Diagnosis search state
  readonly searchQuery = signal('');
  readonly searchResults = signal<DiagnosisSearchResult[]>([]);
  readonly isSearching = signal(false);
  readonly showDropdown = signal(false);

  // ── Form ─────────────────────────────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    patient_id: ['', [Validators.required, Validators.minLength(1)]],
    admission_date: [''],
    consult_reason: this.fb.array([this.fb.control('', Validators.required)], [minLengthArray(1)]),
    current_condition: ['', Validators.required],
    background: this.fb.array([this.fb.control('', Validators.required)], [minLengthArray(1)]),
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

  // ── Computeds ─────────────────────────────────────────────────────────────
  readonly filteredPatients = computed(() => {
    const q = this.patientSearchQuery().trim().toLowerCase();
    const all = this.allPatients();

    if (!q) return all.slice(0, 20); // Show max 20 initially to avoid massive dropdowns

    return all
      .filter((p) => {
        const fullName = `${p.names} ${p.lastnames}`.toLowerCase();
        const documentId = p.document_id.toLowerCase();
        const matchesHistory = p.history_numbers?.some((hn) => hn.toLowerCase().includes(q));
        return fullName.includes(q) || documentId.includes(q) || matchesHistory;
      })
      .slice(0, 20);
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadAllPatients();

    const id = this.route.snapshot.paramMap.get('id');
    const patientQp = this.route.snapshot.queryParamMap.get('patient_id');

    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.admissionId.set(id);
      this.loadAdmission(id);
    } else {
      // Pre-fill patient from query param if navigated from patient detail
      if (patientQp) {
        this.form.get('patient_id')?.setValue(patientQp);
        this.patientsService
          .getById(patientQp)
          .pipe(takeUntil(this.destroy$))
          .subscribe((p) => {
            this.selectedPatient.set(p);
          });
      }
    }

    // Close dropdowns on outside click
    document.addEventListener('click', this.handleOutsideClick);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  private readonly handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#diagnosis-search-container')) {
      this.showDropdown.set(false);
    }
    if (!target.closest('#patient-search-container')) {
      this.showPatientDropdown.set(false);
    }
  };

  // ── Patient Selection ─────────────────────────────────────────────────────
  private loadAllPatients(): void {
    this.patientsService
      .getAll({ page: 1, limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.allPatients.set(res.data);
      });
  }

  onPatientSearchInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.patientSearchQuery.set(q);
    this.showPatientDropdown.set(true);
  }

  selectPatient(p: Patient): void {
    this.selectedPatient.set(p);
    this.form.get('patient_id')?.setValue(p.id);
    this.patientSearchQuery.set('');
    this.showPatientDropdown.set(false);
  }

  clearSelectedPatient(): void {
    this.selectedPatient.set(null);
    this.form.get('patient_id')?.setValue('');
    this.patientSearchQuery.set('');
    // Focus automatically on clearing (optional UX enhancement but tricky in raw angular without ViewChild)
  }

  // ── Setup diagnosis search debounce ───────────────────────────────────────
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
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
      )
      .subscribe({
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

    this.admissionsService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (admission) => {
          this.populateForm(admission);
          if (admission.patient) {
            this.selectedPatient.set(admission.patient);
          }
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
      admission_date: admission.admission_date ? admission.admission_date.slice(0, 16) : '',
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
    if (diagnosis.id) {
      this.diagnosesArray.push(
        this.fb.group({
          id: [diagnosis.id],
          code: [diagnosis.code ?? ''],
          title: [diagnosis.title ?? ''],
          description: [diagnosis.description ?? ''],
        }),
      );
    } else {
      this.diagnosesArray.push(
        this.fb.group({
          code: [diagnosis.code ?? ''],
          title: [diagnosis.title ?? ''],
          description: [diagnosis.description ?? ''],
        }),
      );
    }
  }

  removeDiagnosis(index: number): void {
    const diagnosisGroup = this.diagnosesArray.at(index);
    const diagnosesId = diagnosisGroup?.get('id')?.value;

    if (diagnosesId) {
      this.deletingDiagnosis.set(true);

      this.admissionsService
        .deleteDiagnose(diagnosesId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.deletingDiagnosis.set(false)),
        )
        .subscribe({
          next: () => {
            const currentIndex = this.diagnosesArray.controls.indexOf(diagnosisGroup);
            if (currentIndex !== -1) {
              this.diagnosesArray.removeAt(currentIndex);
            }
          },
          error: (err: Error) => {
            this.loadError.set(err?.message ?? 'Error al eliminar el diagnóstico de la admisión');
          },
        });
    } else {
      // Si es un diagnóstico local (sin ID persistido)
      this.diagnosesArray.removeAt(index);
    }
  }

  // ── Diagnosis search ──────────────────────────────────────────────────────
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.showDropdown.set(true);
    this.searchSubject.next(query);
  }

  selectDiagnosis(result: DiagnosisSearchResult): void {
    // Avoid duplicates based on code, except if code is 'TXT'
    const alreadyAdded = this.diagnosesArray.controls.some(
      (ctrl) => ctrl.get('code')?.value === result.code && result.code !== 'TXT',
    );
    if (!alreadyAdded) {
      this.pushDiagnosisGroup({ code: result.code, title: result.title });
    }
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showDropdown.set(false);
  }

  addCustomDiagnosis(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.pushDiagnosisGroup({ code: 'TXT', title: query });
      this.searchQuery.set('');
      this.searchResults.set([]);
      this.showDropdown.set(false);
    }
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
      next: (data) => {
        const navigateTo = this.isEditMode()
          ? ['/admissions', this.admissionId()]
          : ['/admissions', data.id];
        this.isSubmitting.set(false);
        this.router.navigate(navigateTo);
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
