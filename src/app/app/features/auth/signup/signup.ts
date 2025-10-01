import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest, RoleType, ResponseStatusEnum } from '../../../core/services/auth.services';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class Signup {

  RoleType = RoleType;

  registerData: RegisterRequest = {
    email: '',
    password: '',
    username: '',
    fullName: '',
    role: RoleType.STUDENT,
    regNo: ''
  };

  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSignup() {
    // Validate password match
    if (this.registerData.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    // Prepare data - remove regNo if user is examiner
    const dataToSend = { ...this.registerData };
    if (dataToSend.role === RoleType.EXAMINER) {
      delete dataToSend.regNo;
    }

    console.log('Sending registration data:', dataToSend);

    this.authService.register(dataToSend).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration response:', response);

        if (response.status === ResponseStatusEnum.SUCCESS) {
          this.successMessage = 'Registration successful! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Registration failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);

        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.error?._embedded?.message) {
          this.errorMessage = error.error._embedded.message;
        } else {
          this.errorMessage = 'Registration failed! Please check your input.';
        }
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isStudent(): boolean {
    return this.registerData.role === RoleType.STUDENT;
  }

  passwordsMatch(): boolean {
    return this.registerData.password === this.confirmPassword;
  }
}
