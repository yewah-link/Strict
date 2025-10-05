import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamService, ExamDto, ResponseStatusEnum } from '../../../core/services/exam.service';
import { QuestionService, QuestionDto } from '../../../core/services/question.service';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-detail.html',
  styleUrl: './exam-detail.scss'
})
export class ExamDetail implements OnInit {
  exam: ExamDto | null = null;
  questions: QuestionDto[] = [];
  examId!: number;
  isLoading = false;
  errorMessage = '';
  copiedCode = false;
  copiedLink = false;

  constructor(
    private examService: ExamService,
    private questionService: QuestionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.examId = +params['id'];
      this.loadExamDetails();
      this.loadQuestions();
    });
  }

  loadExamDetails() {
    this.isLoading = true;
    this.errorMessage = '';

    this.examService.getExamById(this.examId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.exam = response._embedded;
        } else {
          this.errorMessage = response.message || 'Failed to load exam';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load exam';
      }
    });
  }

  loadQuestions() {
    this.questionService.getQuestionsByExam(this.examId).subscribe({
      next: (response) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.questions = response._embedded;
        }
      },
      error: (error) => {
        console.error('Failed to load questions:', error);
      }
    });
  }

  editExam() {
    this.router.navigate(['/exams', this.examId, 'edit']);
  }

  deleteExam() {
    if (confirm(`Are you sure you want to delete "${this.exam?.title}"?`)) {
      this.examService.deleteExam(this.examId).subscribe({
        next: (response) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.router.navigate(['/exams']);
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

  addQuestion() {
    this.router.navigate(['/exams', this.examId, 'questions', 'create']);
  }

  editQuestion(questionId: number) {
    this.router.navigate(['/exams', this.examId, 'questions', questionId, 'edit']);
  }

  deleteQuestion(question: QuestionDto) {
    if (confirm('Are you sure you want to delete this question?')) {
      this.questionService.deleteQuestion(question.id!).subscribe({
        next: (response) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.loadQuestions();
          }
        },
        error: (error) => {
          console.error('Failed to delete question:', error);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/exams']);
  }

  // ✅ Copy exam code
  copyExamCode() {
    if (!this.exam?.examCode) return;

    navigator.clipboard.writeText(this.exam.examCode).then(() => {
      this.copiedCode = true;
      setTimeout(() => this.copiedCode = false, 2000);
    });
  }

  // ✅ Copy exam link
  copyExamLink() {
    if (!this.exam?.examLink) return;

    navigator.clipboard.writeText(this.exam.examLink).then(() => {
      this.copiedLink = true;
      setTimeout(() => this.copiedLink = false, 2000);
    });
  }

  // ✅ Share exam
  shareExam() {
    if (!this.exam?.examCode) return;

    const shareText = `Join my exam: "${this.exam.title}"\nExam Code: ${this.exam.examCode}`;

    if (navigator.share) {
      navigator.share({
        title: this.exam.title,
        text: shareText,
        url: this.exam.examLink || undefined
      }).catch(() => this.copyExamCode());
    } else {
      this.copyExamCode();
    }
  }

  getChoiceLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getQuestionTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'TRUE_FALSE': 'True/False',
      'SHORT_ANSWER': 'Short Answer',
      'ESSAY': 'Essay'
    };
    return types[type] || type;
  }
}
