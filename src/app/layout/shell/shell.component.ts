import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

// ─── Nav item model ──────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  route: string;
  /** SVG path data strings for the icon */
  iconPaths: string[];
  /** viewBox attribute for the SVG (defaults to '0 0 24 24') */
  viewBox?: string;
}

// ─── Route → human-readable page title ──────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/patients':   'Pacientes',
  '/admissions': 'Admisiones',
  '/discharges': 'Egresos',
};

function resolveTitleFromUrl(url: string): string {
  const segment = '/' + (url.split('/')[1] ?? '');
  return PAGE_TITLES[segment] ?? 'IVSS Hospital';
}

// ─── Shell Component ─────────────────────────────────────────────────────────

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- ░░░ ROOT LAYOUT ░░░ -->
    <div class="flex h-screen overflow-hidden bg-slate-50">

      <!-- ░░░ SIDEBAR BACKDROP (mobile only) ░░░ -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] lg:hidden"
          (click)="closeSidebar()"
          aria-hidden="true"
        ></div>
      }

      <!-- ░░░░░░░░░░░░░░░░░░░░░░ SIDEBAR ░░░░░░░░░░░░░░░░░░░░░░ -->
      <aside
        id="app-sidebar"
        [class]="sidebarClasses()"
        aria-label="Navegación principal"
        role="navigation"
      >
        <!-- ── Sidebar header ── -->
        <div class="flex items-start gap-3 px-5 pt-6 pb-5 border-b border-slate-700/40">
          <!-- Hospital icon -->
          <div
            class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style="background: rgba(255,255,255,0.10);"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-5 h-5 text-sky-300"
              aria-hidden="true"
            >
              <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/>
              <path d="M9 21V12h6v9"/>
              <path d="M10 8h4M12 6v4"/>
            </svg>
          </div>
          <!-- Hospital name & sub-label -->
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-snug text-white truncate">
              Hospital Dr. P. Peñuela Ruíz
            </p>
            <p class="text-[10.5px] font-medium tracking-wide mt-0.5 truncate" style="color: rgba(125,211,252,0.80);">
              Medicina Interna — IVSS
            </p>
          </div>
        </div>

        <!-- ── Navigation links ── -->
        <nav
          class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
          aria-label="Secciones del sistema"
        >
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="nav-link--active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="nav-link group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              style="color: rgb(203,213,225);"
              (click)="closeSidebar()"
              [attr.aria-current]="isActive(item.route) ? 'page' : null"
            >
              <!-- Icon wrapper -->
              <span class="flex-shrink-0 w-5 h-5 transition-colors duration-150" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  [attr.viewBox]="item.viewBox ?? '0 0 24 24'"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-full h-full"
                >
                  @for (p of item.iconPaths; track $index) {
                    <path [attr.d]="p" />
                  }
                </svg>
              </span>
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <!-- ░░░░░░░░░░░░░░░░░░░░░░ MAIN AREA ░░░░░░░░░░░░░░░░░░░░░░ -->
      <div class="flex flex-1 flex-col min-w-0 overflow-hidden">

        <!-- ── Top header bar ── -->
        <header
          class="flex-shrink-0 flex items-center gap-4 h-14 px-4 bg-white border-b border-slate-200 shadow-sm"
          role="banner"
        >
          <!-- Hamburger button (mobile) -->
          <button
            type="button"
            class="lg:hidden -ml-1 p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 transition-colors"
            (click)="toggleSidebar()"
            [attr.aria-expanded]="sidebarOpen()"
            aria-controls="app-sidebar"
            aria-label="Abrir menú de navegación"
          >
            @if (sidebarOpen()) {
              <!-- X / close icon -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round"
                   stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            } @else {
              <!-- Hamburger icon -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round"
                   stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            }
          </button>

          <!-- Page title -->
          <div class="flex flex-col min-w-0">
            <h1 class="text-base font-semibold text-slate-800 truncate leading-tight">
              {{ pageTitle() }}
            </h1>
            <p class="hidden sm:block text-[10.5px] text-slate-400 truncate leading-tight">
              Hospital Dr. Patrocinio Peñuela Ruíz — Medicina Interna
            </p>
          </div>

          <!-- Spacer + right-side actions -->
          <div class="ml-auto flex items-center gap-2">
            <!-- Date badge -->
            <span class="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium select-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round"
                   stroke-linejoin="round" class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8"  x2="8"  y1="2" y2="6"/>
                <line x1="3"  x2="21" y1="10" y2="10"/>
              </svg>
              {{ todayLabel }}
            </span>

            <!-- Notification button -->
            <button
              type="button"
              class="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 transition-colors"
              aria-label="Notificaciones"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                   stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <!-- Unread dot -->
              <span
                class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white"
                aria-label="Notificaciones pendientes"
                role="status"
              ></span>
            </button>
          </div>
        </header>

        <!-- ── Page content (RouterOutlet) ── -->
        <main
          id="main-content"
          class="flex-1 overflow-y-auto overflow-x-hidden"
          tabindex="-1"
        >
          <div class="px-4 py-6 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
            <router-outlet />
          </div>
        </main>

      </div><!-- /main area -->
    </div><!-- /root layout -->
  `,
  styles: [`
    /*
     * Sidebar gradient — done here because Tailwind v4 JIT
     * does not yet support arbitrary multi-stop gradients inline.
     */
    aside {
      background: linear-gradient(175deg, #1e3a5f 0%, #162d4a 60%, #0f2035 100%);
    }

    /* ── Active nav link ── */
    .nav-link {
      color: rgb(203, 213, 225); /* slate-300 */
    }
    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .nav-link:hover span {
      color: #7dd3fc; /* sky-300 */
    }
    .nav-link--active {
      background-color: rgba(255, 255, 255, 0.12) !important;
      color: #fff !important;
    }
    .nav-link--active span {
      color: #7dd3fc !important; /* sky-300 */
    }
    /* Left accent bar for active item */
    .nav-link--active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: #38bdf8; /* sky-400 */
      border-radius: 0 3px 3px 0;
    }

    /* Thin scrollbar inside the nav */
    aside nav::-webkit-scrollbar        { width: 4px; }
    aside nav::-webkit-scrollbar-track  { background: transparent; }
    aside nav::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.15); border-radius: 2px; }
  `],
  host: { class: 'block' },
})
export class ShellComponent {

  // ── Dependency Injection ──────────────────────────────────────────────────
  private readonly router = inject(Router);

  // ── Sidebar open/close state ──────────────────────────────────────────────
  readonly sidebarOpen = signal(false);

  // ── Current URL as a signal (updates on every navigation) ────────────────
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Human-readable title for the current page, derived from the URL. */
  readonly pageTitle = computed(() => resolveTitleFromUrl(this.currentUrl()));

  // ── Sidebar CSS classes (computed from open state) ────────────────────────
  readonly sidebarClasses = computed<string>(() => {
    const base =
      'fixed inset-y-0 left-0 z-30 flex flex-col w-64 shadow-2xl ' +
      'transition-transform duration-300 ease-in-out ' +
      'lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none lg:flex-shrink-0';
    const slide = this.sidebarOpen() ? 'translate-x-0' : '-translate-x-full';
    return `${base} ${slide}`;
  });

  // ── Navigation items ──────────────────────────────────────────────────────
  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      iconPaths: ['M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'],
    },
    {
      label: 'Pacientes',
      route: '/patients',
      iconPaths: [
        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
        'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
        'M23 21v-2a4 4 0 0 0-3-3.87',
        'M16 3.13a4 4 0 0 1 0 7.75',
      ],
    },
    {
      label: 'Admisiones',
      route: '/admissions',
      iconPaths: [
        'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
        'M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
        'M12 11v4M10 13h4',
      ],
    },
    {
      label: 'Egresos',
      route: '/discharges',
      iconPaths: [
        'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
        'M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
        'M9 13l2 2 4-4',
      ],
    },
  ];

  // ── Today's date formatted for Venezuelan Spanish locale ─────────────────
  readonly todayLabel: string = new Intl.DateTimeFormat('es-VE', {
    weekday: 'short',
    day:     '2-digit',
    month:   'short',
    year:    'numeric',
  }).format(new Date());

  // ── Methods ──────────────────────────────────────────────────────────────
  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  /**
   * Returns true when the given route matches the first URL segment.
   * Used to set aria-current="page" on the active nav link.
   */
  isActive(route: string): boolean {
    const url = this.currentUrl();
    const segment = '/' + (url.split('/')[1] ?? '');
    return segment === route;
  }
}
