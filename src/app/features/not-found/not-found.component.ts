import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="text-center max-w-md px-6">
        <div class="text-8xl font-bold text-slate-200 select-none mb-4">404</div>
        <h1 class="text-2xl font-semibold text-slate-700 mb-2">Página no encontrada</h1>
        <p class="text-slate-500 mb-8">
          El recurso que buscas no existe o fue movido.
        </p>
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-900 text-white font-medium text-sm hover:bg-blue-800 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10"/>
          </svg>
          Volver al inicio
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
