import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss'
})
export class StudentDashboard {

  constructor(private router: Router) {}

  takeExam(): void {
    // Navigate to exam-take without ID - shows link/session ID input screen
    this.router.navigate(['/exam-take']);

    // OR if you want to navigate to exam list first:
    // this.router.navigate(['/exams']);

    // OR if you have a specific exam ID:
    // const examId = 1; // get this from your data
    // this.router.navigate(['/exam-take', examId]);
  }
}
