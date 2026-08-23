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
  templateUrl: './admission-detail.component.html',
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
  newEvolutionDate: string = this.formatDateToLocalString(new Date());
  newEvolutionText = '';
  readonly isAddingEvolution = signal(false);
  readonly evolutionError = signal<string | null>(null);

  // Editing evolution inline
  readonly editingEvolutionId = signal<string | null>(null);
  editEvolutionText = '';
  readonly isSavingEvolution = signal(false);

  private formatDateToLocalString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

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
    const date = new Date(this.newEvolutionDate);

    this.evolutionError.set(null);
    this.isAddingEvolution.set(true);

    this.evolutionsService
      .create({
        admission_id: this.admission()!.id,
        description: text,
        date: date,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (evo) => {
          this.evolutions.update((list) => [evo, ...list]);
          this.newEvolutionText = '';
          this.newEvolutionDate = this.formatDateToLocalString(new Date());
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
