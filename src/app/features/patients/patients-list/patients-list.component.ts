import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { PatientsService } from '../../../core/services/patients.service';
import { Patient, Gender, PaginatedMeta, Scope } from '../../../core/models';
import { ApiError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-patients-list',
  imports: [RouterLink],
  templateUrl: './patients-list.component.html',
})
export class PatientsListComponent implements OnInit {
  private readonly patientsService = inject(PatientsService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly patients = signal<Patient[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly searchMode = signal<'name' | 'document_id' | 'history_number'>('document_id');
  readonly scope = signal<Scope>(Scope.ME);
  readonly searchQuery = signal('');
  readonly deletingId = signal<string | null>(null);

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly skeletonRows = Array.from({ length: 10 });

  private readonly searchSubject = new Subject<void>();

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly searchPlaceholder = computed(() => {
    const mode = this.searchMode();
    if (mode === 'name') return 'Buscar por nombre completo…';
    if (mode === 'document_id') return 'Buscar por número de cédula…';
    return 'Buscar por número de historia clínica…';
  });

  // ── Constructor & RxJS ─────────────────────────────────────────────────────
  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap(() => {
          this.loading.set(true);
          const q = this.searchQuery().trim();
          const mode = this.searchMode();
          const page = this.currentPage();
          const limit = this.pageSize();
          const scope = this.scope();

          if (q) {
            return this.patientsService.search({ q, type: mode, page, limit, scope }).pipe(
              catchError((err: ApiError) => {
                this.error.set(err.message ?? 'Error al buscar pacientes.');
                return of(null);
              }),
            );
          } else {
            return this.patientsService.getAll({ page, limit, scope }).pipe(
              catchError((err: ApiError) => {
                this.error.set(err.message ?? 'Error al cargar los pacientes.');
                return of(null);
              }),
            );
          }
        }),
      )
      .subscribe((response) => {
        if (response !== null) {
          this.patients.set(response.data);
          this.meta.set(response.meta);
        }
        this.loading.set(false);
      });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.fetchData();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  genderLabel(gender: Gender): string {
    return gender === 'M' ? 'Masculino' : 'Femenino';
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  onSearchInput(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.searchQuery.set(q);
    this.currentPage.set(1);
    this.fetchData();
  }

  onModeChange(event: Event) {
    const mode = (event.target as HTMLSelectElement).value as
      'name' | 'document_id' | 'history_number';
    this.searchMode.set(mode);
    this.currentPage.set(1);
    this.fetchData();
  }

  onScopeChange(event: Event) {
    const mode = (event.target as HTMLSelectElement).value as Scope;
    this.scope.set(mode);
    this.currentPage.set(1);
    this.fetchData();
  }

  prevPage() {
    if (this.meta() && this.meta()!.page > 1) {
      this.currentPage.update((p) => p - 1);
      this.fetchData();
    }
  }

  nextPage() {
    if (this.meta() && this.meta()!.page < this.meta()!.total_pages) {
      this.currentPage.update((p) => p + 1);
      this.fetchData();
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  private fetchData(): void {
    this.error.set(null);
    this.searchSubject.next();
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
        // Refresh data on delete
        this.fetchData();
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
