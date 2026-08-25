import { Component, OnInit, inject, signal, computed, input, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { PatientsService } from '../../../core/services/patients.service';
import { Gender, CreatePatientDto, UpdatePatientDto } from '../../../core/models';
import { ApiError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-patient-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './patient-form.component.html',
})
export class PatientFormComponent {
  private readonly patientsService = inject(PatientsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Route input ────────────────────────────────────────────────────────────
  readonly id = input<string | undefined>(undefined);

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly isEditMode = computed(() => !!this.id());

  // ── State ──────────────────────────────────────────────────────────────────
  readonly loadingPatient = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  // ── Form ───────────────────────────────────────────────────────────────────
  form: FormGroup = this.buildForm();

  constructor() {
    effect(() => {
      const patientId = this.id();
      if (patientId) {
        this.loadPatient(patientId);
      }
    });
  }

  get historyNumberControls(): AbstractControl[] {
    return (this.form.get('history_numbers') as FormArray).controls;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  // ngOnInit(): void {
  //   this.buildForm();
  // }

  // ── Form Builder ───────────────────────────────────────────────────────────
  private buildForm() {
    return this.fb.group({
      document_id: ['', [Validators.required, Validators.maxLength(12)]],
      names: ['', [Validators.required, Validators.maxLength(100)]],
      lastnames: ['', [Validators.required, Validators.maxLength(100)]],
      gender: ['' as Gender | '', [Validators.required]],
      address: ['', [Validators.maxLength(200)]],
      birth_year: [null as number | null, [Validators.min(1800)]],
      birth_month: [null as number | null, [Validators.min(1), Validators.max(12)]],
      birth_day: [null as number | null, [Validators.min(1), Validators.max(31)]],
      history_numbers: this.fb.array([]),
      status: [true],
    });
  }

  private loadPatient(id: string): void {
    this.loadingPatient.set(true);
    this.patientsService.getById(id).subscribe({
      next: (patient) => {
        // Rebuild history_numbers FormArray
        const historyArray = this.form.get('history_numbers') as FormArray;
        historyArray.clear();
        (patient.history_numbers ?? []).forEach((h) => historyArray.push(this.fb.control(h)));

        this.form.patchValue({
          document_id: patient.document_id,
          names: patient.names,
          lastnames: patient.lastnames,
          gender: patient.gender,
          address: patient.address,
          birth_year: patient.birth_year ?? null,
          birth_month: patient.birth_month ?? null,
          birth_day: patient.birth_day ?? null,
          status: patient.status,
        });
        this.loadingPatient.set(false);
      },
      error: (err: ApiError) => {
        this.submitError.set(err.message ?? 'Error al cargar los datos del paciente.');
        this.loadingPatient.set(false);
      },
    });
  }

  // ── History Numbers ────────────────────────────────────────────────────────
  addHistoryNumber(): void {
    (this.form.get('history_numbers') as FormArray).push(this.fb.control(''));
  }

  removeHistoryNumber(index: number): void {
    // this.patientsService.deleteHistoryNumber();
    (this.form.get('history_numbers') as FormArray).removeAt(index);
  }

  // ── Validation Helpers ─────────────────────────────────────────────────────
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['maxlength'])
      return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    if (ctrl.errors['min']) return `El valor mínimo es ${ctrl.errors['min'].min}.`;
    if (ctrl.errors['max']) return `El valor máximo es ${ctrl.errors['max'].max}.`;
    return 'Valor inválido.';
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    // Build DTO — strip null/empty optional date fields
    const dto: CreatePatientDto = {
      document_id: raw.document_id,
      names: raw.names.toUpperCase(),
      lastnames: raw.lastnames.toUpperCase(),
      gender: raw.gender as Gender,
      address: raw.address,
      status: raw.status,
      history_numbers: (raw.history_numbers as string[]).filter((h: string) => h.trim()),
      ...(raw.birth_year != null ? { birth_year: Number(raw.birth_year) } : {}),
      ...(raw.birth_month != null ? { birth_month: Number(raw.birth_month) } : {}),
      ...(raw.birth_day != null ? { birth_day: Number(raw.birth_day) } : {}),
    };

    this.submitting.set(true);
    this.submitError.set(null);

    const request$ = this.isEditMode()
      ? this.patientsService.update(this.id()!, dto as UpdatePatientDto)
      : this.patientsService.create(dto);

    request$.subscribe({
      next: (data) => {
        this.submitting.set(false);
        this.router.navigate(['/patients', data.id || this.id()]);
      },
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.submitError.set(err.message ?? 'Ocurrió un error al guardar el paciente.');
      },
    });
  }
}
