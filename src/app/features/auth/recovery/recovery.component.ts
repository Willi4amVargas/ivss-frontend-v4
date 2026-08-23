import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recovery',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-800">Account Recovery</h2>
          <p class="text-slate-500 mt-2">
            {{ step() === 1 ? 'Enter your username to receive a recovery code' : 'Enter your recovery code and new password' }}
          </p>
        </div>

        @if (errorMsg()) {
          <div class="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {{ errorMsg() }}
          </div>
        }
        
        @if (successMsg()) {
          <div class="mb-6 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            {{ successMsg() }}
          </div>
        }

        @if (step() === 1) {
          <form [formGroup]="requestForm" (ngSubmit)="onRequestSubmit()" class="space-y-6">
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

            <button 
              type="submit" 
              [disabled]="requestForm.invalid || isLoading()"
              class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ isLoading() ? 'Requesting...' : 'Send Recovery Code' }}
            </button>
          </form>
        } @else {
          <form [formGroup]="resetForm" (ngSubmit)="onResetSubmit()" class="space-y-6">
            <div>
              <label for="recovery_code" class="block text-sm font-medium text-slate-700 mb-1">Recovery Code</label>
              <input 
                id="recovery_code" 
                type="text" 
                formControlName="recovery_code"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter recovery code"
              />
            </div>
            
            <div>
              <label for="new_password" class="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input 
                id="new_password" 
                type="password" 
                formControlName="new_password"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter new password"
              />
            </div>

            <button 
              type="submit" 
              [disabled]="resetForm.invalid || isLoading()"
              class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ isLoading() ? 'Resetting Password...' : 'Reset Password' }}
            </button>
            
            <button 
              type="button" 
              (click)="goBack()"
              [disabled]="isLoading()"
              class="w-full bg-white text-slate-700 border border-slate-300 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-colors mt-2">
              Back
            </button>
          </form>
        }

        <div class="mt-6 text-center text-sm text-slate-500">
          Remember your password? 
          <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
        </div>
      </div>
    </div>
  `
})
export class RecoveryComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  step = signal<1 | 2>(1);
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  savedUsername = signal<string>('');

  requestForm = this.fb.group({
    username: ['', Validators.required]
  });

  resetForm = this.fb.group({
    recovery_code: ['', Validators.required],
    new_password: ['', [Validators.required]]
  });

  onRequestSubmit() {
    if (this.requestForm.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const username = this.requestForm.value.username!;

    this.authService.requestRecovery(username).subscribe({
      next: () => {
        this.savedUsername.set(username);
        this.step.set(2);
        this.isLoading.set(false);
        this.successMsg.set('Recovery code sent! Please check your email.');
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to request recovery code.');
        this.isLoading.set(false);
      }
    });
  }

  onResetSubmit() {
    if (this.resetForm.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const { recovery_code, new_password } = this.resetForm.value;

    this.authService.submitRecovery({
      username: this.savedUsername(),
      recovery_code: recovery_code!,
      new_password: new_password!
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMsg.set('Password reset successfully! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Failed to reset password.');
        this.isLoading.set(false);
      }
    });
  }
  
  goBack() {
    this.step.set(1);
    this.errorMsg.set(null);
    this.successMsg.set(null);
  }
}
