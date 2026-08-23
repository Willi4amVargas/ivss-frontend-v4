import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-800">IVSS Portal</h2>
          <p class="text-slate-500 mt-2">Sign in to your medical account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          @if (errorMsg()) {
            <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {{ errorMsg() }}
            </div>
          }

          <div>
            <label for="username" class="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              id="username" 
              type="text" 
              formControlName="username"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              id="password" 
              type="password" 
              formControlName="password"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <div class="flex items-center justify-between text-sm">
            <a routerLink="/auth/recovery" class="text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {{ isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-slate-500">
          Don't have an account? 
          <a routerLink="/auth/signup" class="text-blue-600 hover:text-blue-700 font-medium">Sign up</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set(null);

    const { username, password } = this.loginForm.value;

    this.authService.signin({ username: username!, password: password! }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to sign in. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
