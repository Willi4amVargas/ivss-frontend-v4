import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-800">Create Account</h2>
          <p class="text-slate-500 mt-2">Join the IVSS Medical System</p>
        </div>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-4">
          @if (errorMsg()) {
            <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {{ errorMsg() }}
            </div>
          }
          
          @if (successMsg()) {
            <div class="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {{ successMsg() }}
            </div>
          }

          <div>
            <label for="username" class="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              id="username" 
              type="text" 
              formControlName="username"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Choose a username"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              id="email" 
              type="email" 
              formControlName="email"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              id="password" 
              type="password" 
              formControlName="password"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Create a password"
            />
          </div>
          
          <div>
            <label for="description" class="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              id="description" 
              formControlName="description"
              rows="2"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Brief description about yourself"
            ></textarea>
          </div>

          <button 
            type="submit" 
            [disabled]="signupForm.invalid || isLoading()"
            class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6">
            {{ isLoading() ? 'Creating Account...' : 'Sign Up' }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-slate-500">
          Already have an account? 
          <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
        </div>
      </div>
    </div>
  `
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  signupForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    email: ['', [Validators.required, Validators.email]],
    description: [''],
    profile_id: ['39ac8289-397b-4b03-8879-52ab2dd1ff50'] // ESTO ESTA MAL GEMINI PQ ME HARDCODEAS EL EJEMPLO QUE TE MANDE SJAKJSKAJSK
  });

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const data = this.signupForm.value as any;

    this.authService.signup(data).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMsg.set('Account created successfully! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to create account. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
