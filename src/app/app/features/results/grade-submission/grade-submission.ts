import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentExamService, StudentExamDto, GenericResponseV2, ResponseStatusEnum, ChoicesDto } from '../../../core/services/student.service.exam';

interface Question {
  id: number;
  questionText: string;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  marks: number;
  correctAnswer?: string;
  correctChoiceId?: number;
  options?: { id: number; text: string; isCorrect: boolean }[];
}

interface Answer {
  questionId: number;
  studentAnswer: string;
  selectedChoiceId?: number;
  isCorrect?: boolean;
  marksAwarded: number | null;
  feedback?: string;
}

interface SubmissionDetail {
  id: number;
  examId: number;
  examTitle: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentRegNo: string;
  submittedAt: string;
  totalMarks: number;
  score: number | null;
  status: 'PENDING' | 'GRADED' | 'IN_REVIEW';
  timeSpent: string;
  flaggedForReview: boolean;
  violations?: number;
  questions: Question[];
  answers: Answer[];
}

@Component({
  selector: 'app-grade-submission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-submission.html',
  styleUrls: ['./grade-submission.scss']
})
export class GradeSubmission implements OnInit {
  submission: SubmissionDetail | null = null;
  currentQuestionIndex = 0;
  isLoading = true;
  isSaving = false;

  examId: number | null = null;
  submissionId: number | null = null;

  totalScore = 0;
  autoGradedCount = 0;
  manualGradedCount = 0;

  // Expose Math to template
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentExamService: StudentExamService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.examId = +params['examId'];
      this.submissionId = +params['submissionId'];
      this.loadSubmissionDetails();
    });
  }

  loadSubmissionDetails(): void {
    this.isLoading = true;

    if (!this.submissionId) {
      console.error('Submission ID is required');
      this.isLoading = false;
      return;
    }

    this.studentExamService.getStudentExam(this.submissionId).subscribe({
      next: (response) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.mapStudentExamToSubmission(response._embedded);
          this.calculateScores();
          console.log('Loaded submission:', this.submission);
        } else {
          console.error('Failed to load submission details:', response.message);
          alert(`Error: ${response.message}`);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading submission details:', error);
        alert('Failed to load submission. Please try again.');
        this.isLoading = false;
      }
    });
  }

  mapStudentExamToSubmission(studentExam: StudentExamDto): void {
    this.submission = {
      id: studentExam.id || 0,
      examId: studentExam.examId || 0,
      examTitle: studentExam.examTitle || `Exam ${studentExam.examId}`,
      studentId: studentExam.studentId || 0,
      studentName: studentExam.studentName || 'Unknown Student',
      studentEmail: studentExam.studentEmail || '',
      studentRegNo: studentExam.studentRegNo || '',
      submittedAt: studentExam.submittedAt || '',
      totalMarks: studentExam.examTotalMarks || 0,
      score: studentExam.result?.obtainedMarks || null,
      status: this.mapExamStatusToSubmissionStatus(studentExam.status || 'SUBMITTED'),
      timeSpent: this.calculateTimeSpent(studentExam.startedAt, studentExam.submittedAt),
      flaggedForReview: (studentExam.violations?.length || 0) > 0,
      violations: studentExam.violations?.length || 0,
      questions: (studentExam.questions || []).map(q => {
        const correctChoice = q.choices?.find(c => c.isCorrect);
        return {
          id: q.id,
          questionText: q.text,
          questionType: q.type === 'MULTIPLE_CHOICE' ? 'MCQ' :
                       (q.type === 'WRITTEN' ? 'SHORT_ANSWER' : 'ESSAY'),
          marks: q.marks,
          correctAnswer: correctChoice?.choiceText,
          correctChoiceId: correctChoice?.id,
          options: q.choices?.map(c => ({
            id: c.id || 0,
            text: c.choiceText,
            isCorrect: c.isCorrect
          }))
        };
      }),
      answers: (studentExam.answers || []).map(ans => {
        const question = studentExam.questions?.find(q => q.id === ans.questionId);
        let studentAnswerText = '';

        // If it's a multiple choice question
        if (ans.selectedChoiceId && question?.choices) {
          const selectedChoice = question.choices.find(c => c.id === ans.selectedChoiceId);
          studentAnswerText = selectedChoice?.choiceText || `Choice ID: ${ans.selectedChoiceId}`;
        }
        // If it's a written answer
        else if (ans.answerText) {
          studentAnswerText = ans.answerText;
        }

        return {
          questionId: ans.questionId,
          studentAnswer: studentAnswerText,
          selectedChoiceId: ans.selectedChoiceId,
          isCorrect: ans.isCorrect,
          marksAwarded: ans.obtainedMarks !== undefined ? ans.obtainedMarks : null,
          feedback: ''
        };
      })
    };

    console.log('Mapped submission:', this.submission);
  }

  mapExamStatusToSubmissionStatus(status: string): 'PENDING' | 'GRADED' | 'IN_REVIEW' {
    switch (status) {
      case 'GRADED': return 'GRADED';
      case 'SUBMITTED': return 'PENDING';
      default: return 'PENDING';
    }
  }

  calculateTimeSpent(startedAt?: string, submittedAt?: string): string {
    if (!startedAt || !submittedAt) return '0m';

    const start = new Date(startedAt).getTime();
    const end = new Date(submittedAt).getTime();
    const diffMs = end - start;

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getCurrentQuestion(): Question | null {
    if (!this.submission) return null;
    return this.submission.questions[this.currentQuestionIndex];
  }

  getCurrentAnswer(): Answer | null {
    if (!this.submission) return null;
    const question = this.getCurrentQuestion();
    if (!question) return null;
    return this.submission.answers.find(a => a.questionId === question.id) || null;
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  nextQuestion(): void {
    if (this.submission && this.currentQuestionIndex < this.submission.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
  }

  updateMarks(answer: Answer, marks: number): void {
    if (marks < 0) marks = 0;
    const question = this.submission?.questions.find(q => q.id === answer.questionId);
    if (question && marks > question.marks) {
      marks = question.marks;
    }
    answer.marksAwarded = marks;
    this.calculateScores();
  }

  getHalfMarks(marks: number): number {
    return Math.floor(marks / 2);
  }

  autoGrade(): void {
    if (!this.submission) return;

    let gradedCount = 0;

    this.submission.answers.forEach(answer => {
      const question = this.submission!.questions.find(q => q.id === answer.questionId);
      if (!question) return;

      // Auto-grade MCQ only
      if (question.questionType === 'MCQ' && question.correctChoiceId && answer.selectedChoiceId) {
        const isCorrect = answer.selectedChoiceId === question.correctChoiceId;
        answer.isCorrect = isCorrect;
        answer.marksAwarded = isCorrect ? question.marks : 0;
        gradedCount++;
      }
    });

    this.calculateScores();

    if (gradedCount > 0) {
      alert(`Auto-graded ${gradedCount} multiple choice question(s)`);
    } else {
      alert('No multiple choice questions to auto-grade');
    }
  }

  calculateScores(): void {
    if (!this.submission) return;

    this.totalScore = 0;
    this.autoGradedCount = 0;
    this.manualGradedCount = 0;

    this.submission.answers.forEach(answer => {
      if (answer.marksAwarded !== null) {
        this.totalScore += answer.marksAwarded;

        const question = this.submission!.questions.find(q => q.id === answer.questionId);
        if (question) {
          if (question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE') {
            this.autoGradedCount++;
          } else {
            this.manualGradedCount++;
          }
        }
      }
    });
  }

  getQuestionStatusClass(question: Question): string {
    const answer = this.submission?.answers.find(a => a.questionId === question.id);
    if (!answer) return 'bg-secondary';
    if (answer.marksAwarded === null) return 'bg-warning';
    if (answer.marksAwarded === question.marks) return 'bg-success';
    if (answer.marksAwarded > 0) return 'bg-info';
    return 'bg-danger';
  }

  isSubmissionComplete(): boolean {
    if (!this.submission) return false;
    return this.submission.answers.every(a => a.marksAwarded !== null);
  }

  saveProgress(): void {
    if (!this.submission) return;

    this.isSaving = true;

    // TODO: Implement save progress API call
    // You'll need to create a method in the service to update marks for answers

    setTimeout(() => {
      console.log('Progress saved');
      this.isSaving = false;
      alert('Progress saved successfully!');
    }, 500);
  }

  submitGrading(): void {
    if (!this.submission) return;

    if (!this.isSubmissionComplete()) {
      if (!confirm('Not all questions have been graded. Are you sure you want to submit?')) {
        return;
      }
    }

    this.isSaving = true;

    this.submission.status = 'GRADED';
    this.submission.score = this.totalScore;

    // TODO: Implement submit grading API call
    // You'll need to create a method in the service to finalize grading

    setTimeout(() => {
      this.isSaving = false;
      alert(`Grading submitted successfully! Final Score: ${this.totalScore}/${this.submission!.totalMarks}`);
      this.router.navigate(['/submissions'], { queryParams: { examId: this.examId } });
    }, 500);
  }

  backToList(): void {
    this.router.navigate(['/submissions'], { queryParams: { examId: this.examId } });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPercentage(): number {
    if (!this.submission || this.submission.totalMarks === 0) return 0;
    return Math.round((this.totalScore / this.submission.totalMarks) * 100);
  }

  getGradeColor(): string {
    const percentage = this.getPercentage();
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  }

  // Helper method to check if answer is correct for display
  isAnswerCorrect(answer: Answer): boolean {
    const question = this.submission?.questions.find(q => q.id === answer.questionId);
    if (!question) return false;

    if (question.questionType === 'MCQ' && answer.selectedChoiceId && question.correctChoiceId) {
      return answer.selectedChoiceId === question.correctChoiceId;
    }

    return answer.isCorrect || false;
  }

  // Helper method to get choice text by ID
  getChoiceText(questionId: number, choiceId?: number): string {
    if (!choiceId) return '';
    const question = this.submission?.questions.find(q => q.id === questionId);
    const choice = question?.options?.find(opt => opt.id === choiceId);
    return choice?.text || `Choice ID: ${choiceId}`;
  }
}
