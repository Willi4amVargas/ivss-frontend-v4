import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe, DatePipe, TitleCasePipe } from '@angular/common';

import { DischargesService } from '../../../core/services/clinical-records.service';
import { Discharge, PaginatedMeta, Scope } from '../../../core/models';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-discharges-list',
  imports: [RouterLink, SlicePipe, DatePipe, TitleCasePipe],
  templateUrl: './discharges-list.component.html',
})
export class DischargesListComponent implements OnInit {
  private readonly dischargesService = inject(DischargesService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly discharges = signal<Discharge[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Filters
  readonly filterDate = signal<string>('');
  readonly filterStatus = signal<'all' | 'alive' | 'deceased'>('all');
  readonly scope = signal<Scope>(Scope.ME);

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly deletingDischarge = signal<Discharge | null>(null);
  readonly deleteLoading = signal(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly filteredDischarges = computed(() => {
    let list = this.discharges();

    // Morbility status filter (Local)
    const status = this.filterStatus();
    if (status === 'alive') {
      list = list.filter((d) => d.morbility_status === false);
    } else if (status === 'deceased') {
      list = list.filter((d) => d.morbility_status === true);
    }

    // Date filter (Local)
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

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDischarges();
  }

  // ── Methods ────────────────────────────────────────────────────────────────
  loadDischarges(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dischargesService
      .getAll({ page: this.currentPage(), limit: this.pageSize(), scope: this.scope() })
      .subscribe({
        next: (response) => {
          this.discharges.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(
            err?.error?.message ?? err?.message ?? 'No se pudieron cargar los egresos.',
          );
          this.loading.set(false);
        },
      });
  }

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as 'all' | 'alive' | 'deceased';
    this.filterStatus.set(status);
  }

  onDateChange(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    this.filterDate.set(date);
  }

  onScopeChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as Scope;
    this.scope.set(status);
    this.currentPage.set(1);
    this.loadDischarges(); // Re-fetch from API
  }

  clearDate(): void {
    this.filterDate.set('');
  }

  // Pagination Actions
  prevPage() {
    if (this.meta() && this.meta()!.page > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadDischarges();
    }
  }

  nextPage() {
    if (this.meta() && this.meta()!.page < this.meta()!.total_pages) {
      this.currentPage.update((p) => p + 1);
      this.loadDischarges();
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
          this.loadDischarges(); // Refresh from backend after deleting
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? err?.message ?? 'Error al eliminar el egreso.');
        },
      });
  }
}
