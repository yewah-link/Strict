import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { QuestionService, QuestionDto, ResponseStatusEnum } from '../../../core/services/question.service';
import { ExamService, ExamDto } from '../../../core/services/exam.service';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './question-list.html',
  styleUrl: './question-list.scss'
})
export class QuestionList implements OnInit {
  questions: QuestionDto[] = [];
  exam: ExamDto | null = null;
  examId!: number;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private questionService: QuestionService,
    private examService: ExamService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.examId = +params['examId'];
      this.loadExamInfo();
      this.loadQuestions();
    });
  }

  loadExamInfo() {
    this.examService.getExamById(this.examId).subscribe({
      next: (response) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.exam = response._embedded;
        }
      },
      error: (error) => {
        console.error('Failed to load exam info:', error);
      }
    });
  }

  loadQuestions() {
    this.isLoading = true;
    this.errorMessage = '';

    this.questionService.getQuestionsByExam(this.examId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.questions = response._embedded;
          // Debug: Log to check if choices are present
          console.log('Questions loaded:', this.questions);
          this.questions.forEach((q, index) => {
            console.log(`Question ${index + 1} choices:`, q.choices);
          });
        } else {
          this.errorMessage = response.message || 'Failed to load questions';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load questions';
      }
    });
  }

  addQuestion() {
    this.router.navigate(['/exams', this.examId, 'questions', 'create']);
  }

  editQuestion(questionId: number) {
    this.router.navigate(['/exams', this.examId, 'questions', questionId, 'edit']);
  }

  deleteQuestion(question: QuestionDto) {
    if (confirm(`Are you sure you want to delete this question?`)) {
      this.questionService.deleteQuestion(question.id!).subscribe({
        next: (response) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.successMessage = 'Question deleted successfully';
            this.loadQuestions();
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.message || 'Failed to delete question';
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to delete question';
        }
      });
    }
  }

  viewQuestion(questionId: number) {
    this.router.navigate(['/exams', this.examId, 'questions', questionId]);
  }

  backToExam() {
    this.router.navigate(['/exams', this.examId]);
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

  getQuestionTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'bg-primary',
      'TRUE_FALSE': 'bg-success',
      'SHORT_ANSWER': 'bg-warning',
      'ESSAY': 'bg-info'
    };
    return classes[type] || 'bg-secondary';
  }

  getTotalMarks(): number {
    return this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }

  getChoiceLetter(index: number): string {
    return String.fromCharCode(65 + index); // A=65, B=66, C=67, D=68, etc.
  }
}
