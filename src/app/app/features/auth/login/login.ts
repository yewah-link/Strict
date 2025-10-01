import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthRequest, ResponseStatusEnum } from '../../../core/services/auth.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {

  loginData: AuthRequest = {
    email: '',
    password: ''
  };

  showPassword = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onLogin() {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          const user = response._embedded.user;

          // Navigate based on role - FIXED ROUTES
          if (this.authService.isExaminer()) {
            this.router.navigate(['/examiner-dashboard']);
          } else if (this.authService.isStudent()) {
            this.router.navigate(['/student-dashboard']);
          }
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Invalid email or password!';
        console.error('Login error:', error);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
