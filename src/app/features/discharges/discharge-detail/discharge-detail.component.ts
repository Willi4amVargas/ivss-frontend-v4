import { Component, OnInit, inject, signal, input } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DischargesService } from '../../../core/services/clinical-records.service';
import { Discharge } from '../../../core/models';
import { ApiError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-discharge-detail',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="p-6 max-w-3xl mx-auto animate-fade-in">
      <!-- Back nav -->
      <a routerLink="/discharges" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver a Egresos
      </a>

      <!-- Loading -->
      @if (loading()) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          @for (n of [1,2,3,4,5]; track n) {
            <div class="h-5 skeleton rounded w-3/4"></div>
          }
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div role="alert" class="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          {{ error() }}
        </div>
      }

      <!-- Content -->
      @if (discharge(); as d) {
        <!-- Header card -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 class="text-xl font-semibold text-slate-800">Egreso Médico</h1>
              <p class="text-xs font-mono text-slate-400 mt-0.5">ID: {{ d.id }}</p>
            </div>
            <!-- Status badge -->
            @if (d.morbility_status === true) {
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold shrink-0">
                <span class="w-2 h-2 rounded-full bg-red-500" aria-hidden="true"></span>
                Fallecido
              </span>
            } @else if (d.morbility_status === false) {
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold shrink-0">
                <span class="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
                Alta Médica
              </span>
            } @else {
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-sm font-medium shrink-0">
                N/A
              </span>
            }
          </div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <dt class="text-xs font-medium text-slate-500 uppercase tracking-wide">Admisión Asociada</dt>
              <dd class="mt-1.5">
                <a
                  [routerLink]="['/admissions', d.admission_id]"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Ver Ficha de Admisión
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500 uppercase tracking-wide">Fecha de Egreso</dt>
              <dd class="mt-0.5 text-sm text-slate-700">
                @if (d.discharge_date) {
                  {{ d.discharge_date | date:'dd/MM/yyyy, HH:mm' }}
                } @else {
                  <span class="text-slate-400 italic">No especificada</span>
                }
              </dd>
            </div>
          </dl>
        </div>

        <!-- Examen físico -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <h2 class="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Examen Físico de Egreso</h2>
          <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ d.discharge_exam }}</p>
        </div>

        <!-- Plan terapéutico -->
        @if (d.treatment_plan) {
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
            <h2 class="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Plan Terapéutico Post-Hospitalización</h2>
            <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ d.treatment_plan }}</p>
          </div>
        }

        <!-- Diagnósticos -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 class="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Diagnósticos Definitivos
          </h2>
          <div class="space-y-2">
            @for (diag of d.discharges_diagnosis; track diag.id) {
              <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span class="inline-flex shrink-0 px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-xs font-semibold mt-0.5">
                  {{ diag.code }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-700">{{ diag.title }}</p>
                  @if (diag.description) {
                    <p class="text-xs text-slate-500 mt-0.5">{{ diag.description }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <a
            routerLink="/discharges"
            class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Volver
          </a>
          <button
            type="button"
            (click)="downloadPdf()"
            [disabled]="isDownloading()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
          >
            @if (isDownloading()) {
              <svg
                class="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Descargando...
            } @else {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar PDF
            }
          </button>
          <a
            [routerLink]="['/discharges', d.id, 'edit']"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#16304f] transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Editar Egreso
          </a>
        </div>
      }
    </div>
  `,
})
export class DischargeDetailComponent implements OnInit {
  private readonly svc = inject(DischargesService);
  private readonly route = inject(ActivatedRoute);

  readonly discharge = signal<Discharge | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isDownloading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de egreso no especificado.');
      this.loading.set(false);
      return;
    }
    this.svc.getById(id).subscribe({
      next: (d) => {
        this.discharge.set(d);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  downloadPdf(): void {
    const currentDischarge = this.discharge();
    if (!currentDischarge) return;
    
    this.isDownloading.set(true);
    
    this.svc.downloadDocument(currentDischarge.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `discharge_${currentDischarge.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading.set(false);
      },
      error: () => {
        console.error('Error downloading document');
        this.isDownloading.set(false);
      }
    });
  }
}
