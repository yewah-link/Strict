import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface PendingSubmission {
  id: number;
  examId: number;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  answeredQuestions: number;
  totalQuestions: number;
}

interface ExamRequiringAttention {
  id: number;
  title: string;
  deadline: string;
  totalSubmissions: number;
  gradedCount: number;
  pendingCount: number;
  gradedPercentage: number;
  pendingPercentage: number;
}

@Component({
  selector: 'app-examiner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './examiner-dashboard.html',
  styleUrls: ['./examiner-dashboard.scss']
})
export class ExaminerDashboard implements OnInit {
  pendingSubmissions: PendingSubmission[] = [];
  examsRequiringAttention: ExamRequiringAttention[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Mock data for pending submissions
    this.pendingSubmissions = [
      {
        id: 1,
        examId: 1,
        examTitle: 'Mathematics Final Exam',
        studentName: 'John Doe',
        studentEmail: 'john.doe@example.com',
        submittedAt: '2 hours ago',
        answeredQuestions: 20,
        totalQuestions: 20
      },
      {
        id: 3,
        examId: 1,
        examTitle: 'Mathematics Final Exam',
        studentName: 'Bob Johnson',
        studentEmail: 'bob.johnson@example.com',
        submittedAt: '5 hours ago',
        answeredQuestions: 18,
        totalQuestions: 20
      },
      {
        id: 6,
        examId: 2,
        examTitle: 'Physics Midterm',
        studentName: 'Emma Davis',
        studentEmail: 'emma.davis@example.com',
        submittedAt: '1 day ago',
        answeredQuestions: 15,
        totalQuestions: 15
      }
    ];

    // Mock data for exams requiring attention
    this.examsRequiringAttention = [
      {
        id: 1,
        title: 'Mathematics Final Exam',
        deadline: 'Due in 2 days',
        totalSubmissions: 45,
        gradedCount: 30,
        pendingCount: 15,
        gradedPercentage: 67,
        pendingPercentage: 33
      },
      {
        id: 2,
        title: 'Physics Midterm',
        deadline: 'Due tomorrow',
        totalSubmissions: 32,
        gradedCount: 20,
        pendingCount: 12,
        gradedPercentage: 63,
        pendingPercentage: 37
      }
    ];
  }
}
