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
  templateUrl: './dashboard.component.html',
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
    hour:"numeric"
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
      patients: this.patientsService.getAll({ page: 1, limit: 1 }),
      admissions: this.admissionsService.getAll({ page: 1, limit: 5 }),
      discharges: this.dischargesService.getAll({ page: 1, limit: 1 }),
    }).subscribe({
      next: ({ patients, admissions, discharges }) => {
        this.totalPatients.set(patients.meta.total_items);
        this.totalAdmissions.set(admissions.meta.total_items);
        this.totalDischarges.set(discharges.meta.total_items);
        this._admissions.set(admissions.data);
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
