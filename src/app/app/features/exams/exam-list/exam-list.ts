import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ExamService, ExamDto, ResponseStatusEnum } from '../../../core/services/exam.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-list.html',
  styleUrl: './exam-list.scss'
})
export class ExamList implements OnInit {
  exams: ExamDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private examService: ExamService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.isLoading = true;
    this.errorMessage = '';

    this.examService.getAllExams().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.exams = response._embedded;
        } else {
          this.errorMessage = response.message || 'Failed to load exams';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load exams';
      }
    });
  }

  viewExam(examId: number) {
    this.router.navigate(['/exams', examId]);
  }

  editExam(examId: number) {
    this.router.navigate(['/exams', examId, 'edit']);
  }

  deleteExam(exam: ExamDto) {
    if (confirm(`Are you sure you want to delete "${exam.title}"?`)) {
      this.examService.deleteExam(exam.id!).subscribe({
        next: (response) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.successMessage = 'Exam deleted successfully';
            this.loadExams();
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.message || 'Failed to delete exam';
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to delete exam';
        }
      });
    }
  }

  createExam() {
    this.router.navigate(['/exams/create']);
  }
}
