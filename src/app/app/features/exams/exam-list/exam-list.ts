import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router} from '@angular/router';
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
  copiedCodeId: number | null = null; // ✅ Added this property

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

  // ✅ Copy exam code to clipboard
  copyExamCode(exam: ExamDto) {
    if (!exam.examCode) {
      this.errorMessage = 'No exam code available';
      return;
    }

    navigator.clipboard.writeText(exam.examCode).then(() => {
      this.copiedCodeId = exam.id!;
      this.successMessage = `Exam code "${exam.examCode}" copied to clipboard!`;

      setTimeout(() => {
        this.copiedCodeId = null;
        this.successMessage = '';
      }, 2000);
    }).catch(() => {
      this.errorMessage = 'Failed to copy exam code';
    });
  }

  // ✅ Copy exam link to clipboard
  copyExamLink(exam: ExamDto) {
    if (!exam.examLink) {
      this.errorMessage = 'No exam link available';
      return;
    }

    navigator.clipboard.writeText(exam.examLink).then(() => {
      this.copiedCodeId = exam.id!;
      this.successMessage = 'Exam link copied to clipboard!';

      setTimeout(() => {
        this.copiedCodeId = null;
        this.successMessage = '';
      }, 2000);
    }).catch(() => {
      this.errorMessage = 'Failed to copy exam link';
    });
  }

  // ✅ Share exam code (opens share dialog or copies)
  shareExamCode(exam: ExamDto) {
    if (!exam.examCode) {
      this.errorMessage = 'No exam code available';
      return;
    }

    const shareText = `Join my exam: "${exam.title}"\nExam Code: ${exam.examCode}\nDuration: ${exam.duration} minutes`;

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      navigator.share({
        title: exam.title,
        text: shareText,
        url: exam.examLink || undefined
      }).catch(() => {
        // Fallback to copy if share is cancelled
        this.copyExamCode(exam);
      });
    } else {
      // Fallback: just copy to clipboard
      this.copyExamCode(exam);
    }
  }
}
