import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

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
  '/dashboard': 'Dashboard',
  '/patients': 'Pacientes',
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
  templateUrl: './shell.component.html',
  styles: [
    `
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
      aside nav::-webkit-scrollbar {
        width: 4px;
      }
      aside nav::-webkit-scrollbar-track {
        background: transparent;
      }
      aside nav::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
      }
    `,
  ],
  host: { class: 'block' },
})
export class ShellComponent {
  // ── Dependency Injection ──────────────────────────────────────────────────
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // ── Auth state ────────────────────────────────────────────────────────────
  readonly currentUser = this.authService.currentUser;

  ngOnInit() {
    if (!this.currentUser()) {
      this.authService.fetchMe().subscribe();
    }
  }

  logout(): void {
    this.authService.logout();
  }

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
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
