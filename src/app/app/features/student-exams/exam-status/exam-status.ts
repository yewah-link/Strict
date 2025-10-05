import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ResponseStatusEnum, StudentExamDto, StudentExamService, GenericResponseV2 } from '../../../core/services/student.service.exam';

@Component({
  selector: 'app-exam-status',
  standalone: true,
  imports: [],
  templateUrl: './exam-status.html',
  styleUrl: './exam-status.scss'
})
export class ExamStatus implements OnInit, OnDestroy {
  studentExamId!: number;
  examCompleted: boolean = false;
  isLoading: boolean = true;
  examResult: any = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentExamService: StudentExamService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.studentExamId = +params['id'];
      if (this.studentExamId) {
        this.loadExamStatus();
      } else {
        this.isLoading = false;
        this.examCompleted = false;
      }
    });
  }

  loadExamStatus(): void {
    this.isLoading = true;

    // First get the exam status
    const statusSub = this.studentExamService.getExamStatus(this.studentExamId)
      .subscribe({
        next: (response: GenericResponseV2<string>) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            const status = response._embedded;

            // Then get full exam details
            this.loadExamDetails();
          } else {
            console.error('Failed to get exam status:', response.message);
            this.isLoading = false;
            this.examCompleted = false;
          }
        },
        error: (error: any) => {
          console.error('Error loading exam status:', error);
          this.isLoading = false;
          this.examCompleted = false;
        }
      });

    this.subscriptions.push(statusSub);
  }

  private loadExamDetails(): void {
    const examSub = this.studentExamService.getStudentExam(this.studentExamId)
      .subscribe({
        next: (response: GenericResponseV2<StudentExamDto>) => {
          if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
            const exam: StudentExamDto = response._embedded;

            this.examCompleted = exam.status === 'COMPLETED' ||
                                 exam.status === 'SUBMITTED' ||
                                 exam.status === 'GRADED';

            this.examResult = {
              submittedAt: exam.submittedAt
                ? new Date(exam.submittedAt).toLocaleString()
                : 'Not submitted',
              totalQuestions: exam.answers?.length || 0,
              status: this.getStatusLabel(exam.status),
              score: exam.result ? `${exam.result.obtainedMarks}/${exam.result.totalMarks}` : 'Pending',
              percentage: exam.result?.percentage ? `${exam.result.percentage}%` : 'N/A'
            };

            this.isLoading = false;
          } else {
            console.error('Failed to load exam details:', response.message);
            this.isLoading = false;
            this.examCompleted = false;
          }
        },
        error: (error: any) => {
          console.error('Error loading exam details:', error);
          this.isLoading = false;
          this.examCompleted = false;
        }
      });

    this.subscriptions.push(examSub);
  }

  private getStatusLabel(status?: string): string {
    switch(status) {
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'SUBMITTED': return 'Under Review';
      case 'GRADED': return 'Graded';
      default: return 'Unknown';
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  viewResults(): void {
    // Navigate to results page with the studentExamId
    this.router.navigate(['/results', this.studentExamId]);
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
