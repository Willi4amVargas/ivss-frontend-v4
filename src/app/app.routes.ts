import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard — IVSS Hospital',
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patients-list/patients-list.component').then(
            (m) => m.PatientsListComponent,
          ),
        title: 'Pacientes — IVSS Hospital',
      },
      {
        path: 'patients/new',
        loadComponent: () =>
          import('./features/patients/patient-form/patient-form.component').then(
            (m) => m.PatientFormComponent,
          ),
        title: 'Nuevo Paciente — IVSS Hospital',
      },
      {
        path: 'patients/:id',
        loadComponent: () =>
          import('./features/patients/patient-detail/patient-detail.component').then(
            (m) => m.PatientDetailComponent,
          ),
        title: 'Detalle Paciente — IVSS Hospital',
      },
      {
        path: 'patients/:id/edit',
        loadComponent: () =>
          import('./features/patients/patient-form/patient-form.component').then(
            (m) => m.PatientFormComponent,
          ),
        title: 'Editar Paciente — IVSS Hospital',
      },
      {
        path: 'admissions',
        loadComponent: () =>
          import('./features/admissions/admissions-list/admissions-list.component').then(
            (m) => m.AdmissionsListComponent,
          ),
        title: 'Admisiones — IVSS Hospital',
      },
      {
        path: 'admissions/new',
        loadComponent: () =>
          import('./features/admissions/admission-form/admission-form.component').then(
            (m) => m.AdmissionFormComponent,
          ),
        title: 'Nueva Admisión — IVSS Hospital',
      },
      {
        path: 'admissions/:id',
        loadComponent: () =>
          import('./features/admissions/admission-detail/admission-detail.component').then(
            (m) => m.AdmissionDetailComponent,
          ),
        title: 'Detalle Admisión — IVSS Hospital',
      },
      {
        path: 'admissions/:id/edit',
        loadComponent: () =>
          import('./features/admissions/admission-form/admission-form.component').then(
            (m) => m.AdmissionFormComponent,
          ),
        title: 'Editar Admisión — IVSS Hospital',
      },
      {
        path: 'discharges',
        loadComponent: () =>
          import('./features/discharges/discharges-list/discharges-list.component').then(
            (m) => m.DischargesListComponent,
          ),
        title: 'Egresos — IVSS Hospital',
      },
      {
        path: 'discharges/new',
        loadComponent: () =>
          import('./features/discharges/discharge-form/discharge-form.component').then(
            (m) => m.DischargeFormComponent,
          ),
        title: 'Nuevo Egreso — IVSS Hospital',
      },
      {
        path: 'discharges/:id',
        loadComponent: () =>
          import('./features/discharges/discharge-detail/discharge-detail.component').then(
            (m) => m.DischargeDetailComponent,
          ),
        title: 'Detalle Egreso — IVSS Hospital',
      },
      {
        path: 'discharges/:id/edit',
        loadComponent: () =>
          import('./features/discharges/discharge-form/discharge-form.component').then(
            (m) => m.DischargeFormComponent,
          ),
        title: 'Editar Egreso — IVSS Hospital',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: '404 — IVSS Hospital',
  },
];
