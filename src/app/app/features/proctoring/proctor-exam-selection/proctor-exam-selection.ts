import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamDto, ExamService, ResponseStatusEnum } from '../../../core/services/exam.service';
import { ProctoringService, ProctoringSessionDto, GenericResponseV2 } from '../../../core/services/proctoring.service';

@Component({
  selector: 'app-proctor-exam-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proctor-exam-selection.html',
  styleUrls: ['./proctor-exam-selection.scss']
})
export class ProctorExamSelection implements OnInit {
  exams: ExamDto[] = [];
  filteredExams: ExamDto[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  proctorId = 1; // TODO: Get from auth service/user context
  
  // For handling existing sessions
  showExistingSessionPrompt = false;
  existingSessionExamId: number | null = null;

  constructor(
    private examService: ExamService,
    private proctoringService: ProctoringService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAvailableExams();
  }

  loadAvailableExams() {
    this.isLoading = true;
    this.errorMessage = '';

    this.examService.getAllExams().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.exams = response._embedded;
          this.filteredExams = [...this.exams];
        } else {
          this.errorMessage = response.message || 'Failed to load exams';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load available exams';
        console.error('Error loading exams:', error);
      }
    });
  }

  filterExams() {
    if (!this.searchTerm.trim()) {
      this.filteredExams = [...this.exams];
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredExams = this.exams.filter(exam =>
      exam.title.toLowerCase().includes(search) ||
      exam.examCode?.toLowerCase().includes(search) ||
      exam.description?.toLowerCase().includes(search)
    );
  }

  startProctoring(exam: ExamDto) {
    if (!exam.id) {
      this.errorMessage = 'Invalid exam ID';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.showExistingSessionPrompt = false;

    this.proctoringService.startProctoringSession(exam.id, this.proctorId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          const sessionId = response._embedded.id;
          // Navigate immediately without success message
          this.router.navigate(['/proctoring/session', sessionId], {
            state: { examId: exam.id }
          });
        } else {
          this.errorMessage = response.message || 'Failed to start proctoring session';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        
        // Check if error is because session already exists
        if (error.error?.message) {
          const errorMsg = error.error.message;
          
          if (errorMsg.includes('already exists') || errorMsg.includes('Active proctoring session')) {
            this.existingSessionExamId = exam.id ?? null;
            this.showExistingSessionPrompt = true;
            this.errorMessage = `An active proctoring session already exists for "${exam.title}".`;
          } else {
            this.errorMessage = errorMsg;
          }
        } else if (error.status === 400) {
          this.errorMessage = 'Bad request: Unable to start proctoring session';
        } else if (error.status === 404) {
          this.errorMessage = 'Exam not found';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error: Please try again later';
        } else {
          this.errorMessage = 'Failed to start proctoring session';
        }
        
        console.error('Error starting proctoring:', error);
      }
    });
  }

  viewExistingSession() {
    if (!this.existingSessionExamId) return;

    this.isLoading = true;
    this.showExistingSessionPrompt = false;

    this.proctoringService.getActiveSessionByExamId(this.existingSessionExamId).subscribe({
      next: (response: GenericResponseV2<ProctoringSessionDto>) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded?.id) {
          const sessionId = response._embedded.id;
          // Navigate immediately without success message
          this.router.navigate(['/proctoring/session', sessionId], {
            state: { examId: this.existingSessionExamId }
          });
        } else {
          this.errorMessage = response.message || 'No active session found for this exam';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error fetching existing session:', error);
        this.errorMessage = 'Could not retrieve existing session. Please try again.';
      }
    });
  }

  cancelExistingSessionPrompt() {
    this.showExistingSessionPrompt = false;
    this.existingSessionExamId = null;
    this.errorMessage = '';
  }

  isExamActive(exam: ExamDto): boolean {
    if (!exam.startTime || !exam.endTime) return false;
    
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);
    
    return now >= start && now <= end;
  }

  isExamUpcoming(exam: ExamDto): boolean {
    if (!exam.startTime) return false;
    
    const now = new Date();
    const start = new Date(exam.startTime);
    
    return now < start;
  }

  isExamEnded(exam: ExamDto): boolean {
    if (!exam.endTime) return false;
    
    const now = new Date();
    const end = new Date(exam.endTime);
    
    return now > end;
  }

  getExamStatusBadge(exam: ExamDto): string {
    if (this.isExamActive(exam)) return 'bg-success';
    if (this.isExamUpcoming(exam)) return 'bg-info';
    if (this.isExamEnded(exam)) return 'bg-secondary';
    return 'bg-warning';
  }

  getExamStatusText(exam: ExamDto): string {
    if (this.isExamActive(exam)) return 'Active';
    if (this.isExamUpcoming(exam)) return 'Upcoming';
    if (this.isExamEnded(exam)) return 'Ended';
    return 'Not Scheduled';
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  refreshExams() {
    this.searchTerm = '';
    this.showExistingSessionPrompt = false;
    this.existingSessionExamId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.loadAvailableExams();
  }
}