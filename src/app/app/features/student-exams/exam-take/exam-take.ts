import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import {
  StudentExamService,
  GenericResponseV2 as StudentGenericResponse,
  StudentExamDto,
  ResponseStatusEnum as StudentResponseStatusEnum,
  StudentAnswerDto
} from '../../../core/services/student.service.exam';

import {
  ExamService,
  ExamDto,
  QuestionDto,
  ChoicesDto,
  GenericResponseV2 as ExamGenericResponse,
  ResponseStatusEnum as ExamResponseStatusEnum
} from '../../../core/services/exam.service';

import { ProctoringService } from '../../../core/services/proctoring.service';

interface Question {
  id: number;
  questionText: string;
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false';
  points: number;
  options?: string[];
  choices?: ChoicesDto[];
  selectedAnswer?: any;
}

@Component({
  selector: 'app-exam-take',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './exam-take.html',
  styleUrl: './exam-take.scss'
})
export class ExamTake implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // Make String available in template for letter generation (A, B, C, D)
  String = String;

  sessionId: string = '';
  examId?: number;
  studentExamId?: number;
  studentId: number = 1;

  exam: ExamDto | null = null;
  questions: Question[] = [];

  showLinkInput = false;
  isLoading = true;
  error: string | null = null;
  timeRemaining = '00:00:00';
  isProctoringActive = false;
  proctoringSessionId?: number;

  private subscriptions: Subscription[] = [];
  private mediaStream: MediaStream | null = null;
  private timerSubscription?: Subscription;
  private examDurationSeconds: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentExamService: StudentExamService,
    private examService: ExamService,
    private proctoringService: ProctoringService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.params.subscribe(params => {
        if (params['sessionId']) {
          this.sessionId = (params['sessionId'] || '').toString();
          this.sessionId = this.sessionId.split('/').pop() || this.sessionId;
          this.accessExamByLink(false);
        } else if (params['id']) {
          this.examId = +params['id'];
          if (!isNaN(this.examId)) {
            this.startExamByExamId();
          } else {
            this.error = 'Invalid exam id';
            this.isLoading = false;
          }
        } else {
          this.showLinkInput = true;
          this.isLoading = false;
        }
      })
    );
  }

  accessExamByLink(manual: boolean = true): void {
    if (manual && !this.sessionId.trim()) {
      this.error = 'Please enter a valid exam session ID';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const cleanSessionId = (this.sessionId || '').split('/').pop() || this.sessionId;

    // Call /api/v1/exam/link/{examCode} which returns ExamDto with questions
    this.examService.getExamByCode(cleanSessionId).subscribe({
      next: (response: ExamGenericResponse<ExamDto>) => {
        if (response.status === ExamResponseStatusEnum.SUCCESS && response._embedded) {
          const examData = response._embedded;
          this.examId = examData.id;
          this.sessionId = cleanSessionId;
          this.showLinkInput = false;
          
          // For now, use a placeholder studentExamId
          // You'll need to create a proper backend endpoint that returns studentExamId with the exam
          this.studentExamId = this.examId; // Temporary - replace with proper backend integration
          
          this.loadExamFromData(examData);
        } else {
          this.isLoading = false;
          this.error = response.message || 'Invalid exam link or session ID';
        }
      },
      error: (err: any) => {
        console.error('Error accessing exam:', err);
        this.isLoading = false;
        this.error = 'Failed to access exam. Please check the link and try again.';
      }
    });
  }

  startExamByExamId(): void {
    if (!this.examId) {
      this.error = 'Exam id missing';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.studentExamService.startExam(this.examId, this.studentId).subscribe({
      next: (response: StudentGenericResponse<StudentExamDto>) => {
        if (response.status === StudentResponseStatusEnum.SUCCESS && response._embedded) {
          const studentExam = response._embedded;
          this.studentExamId = studentExam.id;
          this.sessionId = studentExam.sessionId || '';
          
          // Load exam data with questions
          this.examService.getExamById(this.examId!).subscribe({
            next: (examResp) => {
              if (examResp.status === ExamResponseStatusEnum.SUCCESS && examResp._embedded) {
                this.loadExamFromData(examResp._embedded);
              } else {
                this.isLoading = false;
                this.error = 'Failed to load exam details';
              }
            },
            error: (err) => {
              console.error('Error loading exam:', err);
              this.isLoading = false;
              this.error = 'Failed to load exam details';
            }
          });
        } else {
          this.isLoading = false;
          this.error = response.message || 'Failed to start exam';
        }
      },
      error: (err: any) => {
        console.error('Error starting exam:', err);
        this.isLoading = false;
        this.error = 'Failed to start exam. Please try again.';
      }
    });
  }

  private loadExamFromData(examData: ExamDto): void {
    this.isLoading = false;
    
    this.exam = {
      id: examData.id,
      title: examData.title,
      description: examData.description,
      instructions: examData.description || 'Please read each question carefully and provide your best answer.',
      duration: examData.duration,
      startTime: examData.startTime,
      endTime: examData.endTime
    } as ExamDto;
    
    this.examDurationSeconds = (this.exam.duration || 0) * 60;
    
    const apiQuestions = examData.questions || [];
    
    this.questions = apiQuestions.map((q: QuestionDto) => {
      const mappedOptions = (q.choices || [])
        .map((c: ChoicesDto) => c.choiceText || '')
        .filter((opt: string) => opt.trim());
      
      // Convert backend type format (MULTIPLE_CHOICE) to frontend format (multiple-choice)
      const questionType = q.type?.toLowerCase().replace(/_/g, '-') as any;
      
      return {
        id: q.id || 0,
        questionText: q.text,
        type: questionType,
        points: q.marks || 0,
        options: mappedOptions,
        choices: q.choices || [],
        selectedAnswer: questionType === 'short-answer' || questionType === 'essay' ? '' : null
      };
    });
    
    this.setupProctoringAndTimer();
  }

  private async setupProctoringAndTimer(): Promise<void> {
    this.startTimer();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      setTimeout(() => {
        if (this.videoElement && this.mediaStream) {
          try {
            this.videoElement.nativeElement.srcObject = this.mediaStream;
            this.videoElement.nativeElement.play().catch(() => {});
          } catch (e) {
            console.warn('Could not attach stream to video element', e);
          }
        }
      }, 100);

      this.isProctoringActive = true;

      if (this.examId) {
        this.proctoringService.startProctoringSession(this.examId, this.studentId).subscribe({
          next: (res) => {
            if (res.status === ExamResponseStatusEnum.SUCCESS && (res as any)._embedded) {
              this.proctoringSessionId = (res as any)._embedded.id;
            }
          },
          error: (err) => {
            console.error('Failed to start proctoring session:', err);
          }
        });
      }
    } catch (err) {
      console.error('Media access denied or error:', err);
      this.error = 'Camera/microphone access required to take this exam.';
      this.isProctoringActive = false;
    }
  }

  private startTimer(): void {
    if (this.timerSubscription) return;

    let seconds = this.examDurationSeconds > 0 ? this.examDurationSeconds : 0;
    this.updateTimeDisplay(seconds);

    this.timerSubscription = interval(1000).subscribe(() => {
      seconds--;
      this.updateTimeDisplay(seconds);
      if (seconds <= 0) {
        this.timerSubscription?.unsubscribe();
        this.autoSubmitExam();
      }
    });
  }

  private updateTimeDisplay(seconds: number) {
    if (seconds < 0) seconds = 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    this.timeRemaining = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  isTimerWarning(): boolean {
    const parts = this.timeRemaining.split(':').map(p => parseInt(p, 10));
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    return hours === 0 && minutes < 5;
  }

  submitExam(): void {
    if (!confirm('Are you sure you want to submit the exam? You cannot change answers after submission.')) {
      return;
    }

    if (!this.studentExamId) {
      this.error = 'Invalid exam session';
      return;
    }

    const answers: StudentAnswerDto[] = this.questions.map(q => {
      let selectedOptionId: number | undefined = undefined;
      let answerText = '';

      if (q.type === 'multiple-choice' && q.selectedAnswer && q.choices) {
        const selectedChoice = q.choices.find(c => c.choiceText === q.selectedAnswer);
        selectedOptionId = selectedChoice?.id;
      } else if (q.selectedAnswer) {
        answerText = q.selectedAnswer.toString();
      }

      return {
        questionId: q.id,
        selectedOptionId,
        answerText
      };
    });

    this.studentExamService.submitExam(this.studentExamId, answers).subscribe({
      next: (res) => {
        if (res.status === StudentResponseStatusEnum.SUCCESS) {
          this.endProctoringSession();
          this.router.navigate(['/exam-status', this.studentExamId]);
        } else {
          this.error = res.message || 'Failed to submit exam';
        }
      },
      error: (err) => {
        console.error('Error submitting exam:', err);
        this.error = 'Failed to submit exam. Please try again.';
      }
    });
  }

  autoSubmitExam(): void {
    if (!this.studentExamId) {
      this.router.navigate(['/exam-status']);
      return;
    }

    alert('Time is up! Your exam will be submitted automatically.');

    this.studentExamService.autoSubmitExam(this.studentExamId).subscribe({
      next: (res) => {
        this.endProctoringSession();
        this.router.navigate(['/exam-status', this.studentExamId]);
      },
      error: (err) => {
        console.error('Auto-submit failed:', err);
        this.endProctoringSession();
        this.router.navigate(['/exam-status', this.studentExamId]);
      }
    });
  }

  endProctoringSession(): void {
    if (!this.proctoringSessionId) return;

    this.proctoringService.endProctoringSession(this.proctoringSessionId).subscribe({
      next: (res) => {
        console.log('Proctoring session ended.');
      },
      error: (err) => {
        console.error('Error ending proctoring session:', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.subscriptions.forEach(s => s.unsubscribe());
    try { this.endProctoringSession(); } catch (e) { /* ignore */ }
  }
}