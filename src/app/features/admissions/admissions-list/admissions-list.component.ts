import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AdmissionsService } from '../../../core/services/clinical-records.service';
import { Admission, PaginatedMeta, Scope } from '../../../core/models';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admissions-list',
  imports: [RouterLink, DatePipe, TitleCasePipe],
  templateUrl: './admission-list.component.html',
})
export class AdmissionsListComponent implements OnInit {
  private readonly admissionsService = inject(AdmissionsService);

  readonly admissions = signal<Admission[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);

  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  // Filters
  readonly filterStatus = signal<'active' | 'all'>('active');
  readonly scope = signal<Scope>(Scope.ME);
  readonly filterDate = signal<string>('');

  // Pagination State
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly deletingAdmission = signal<Admission | null>(null);
  readonly isDeleting = signal(false);

  readonly filteredAdmissions = computed(() => {
    let list = this.admissions();
    const dateQuery = this.filterDate();

    if (dateQuery) {
      list = list.filter((a) => {
        if (!a.admission_date) return false;
        // admission_date is typically in ISO format "2026-03-30T..."
        return a.admission_date.startsWith(dateQuery);
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.loadAdmissions();
  }

  loadAdmissions(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const statusParam = this.filterStatus() === 'active' ? 'active' : undefined;
    const scope = this.scope();

    this.admissionsService
      .getAll({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: statusParam,
        scope,
      })
      .subscribe({
        next: (response) => {
          this.admissions.set(response.data);
          this.meta.set(response.meta);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set(err?.message ?? 'Error desconocido');
          this.isLoading.set(false);
        },
      });
  }

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as 'active' | 'all';
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadAdmissions(); // Re-fetch from API
  }

  onScopeChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as Scope;
    this.scope.set(status);
    this.currentPage.set(1);
    this.loadAdmissions(); // Re-fetch from API
  }

  onDateChange(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    this.filterDate.set(date);
    // Note: Local date filtering on paginated result. To truly filter by date, the backend must support it.
  }

  clearDate(): void {
    this.filterDate.set('');
  }

  // Pagination Actions
  prevPage() {
    if (this.meta() && this.meta()!.page > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadAdmissions();
    }
  }

  nextPage() {
    if (this.meta() && this.meta()!.page < this.meta()!.total_pages) {
      this.currentPage.update((p) => p + 1);
      this.loadAdmissions();
    }
  }

  confirmDelete(admission: Admission): void {
    this.deletingAdmission.set(admission);
  }

  deleteAdmission(): void {
    const target = this.deletingAdmission();
    if (!target) return;

    this.isDeleting.set(true);

    this.admissionsService
      .delete(target.id)
      .pipe(
        finalize(() => {
          this.deletingAdmission.set(null);
          this.isDeleting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.loadAdmissions(); // Refresh the list after deleting
        },
        error: (err: Error) => {
          this.errorMsg.set(err?.message ?? 'Error al eliminar');
        },
      });
  }
}
