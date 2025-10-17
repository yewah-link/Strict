import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentExamService, StudentExamDto, GenericResponseV2 } from '../../../core/services/student.service.exam';
import { ExamService } from '../../../core/services/exam.service';
import { ResultService, ResultDto } from '../../../core/services/result.service'; // ✅ Import ResultService

interface ResultDisplay {
  sno: number;
  studentName: string;
  regNo: string;
  email: string;
  score: string;
  percentage: string;
  examTitle: string;
  examId: number;
  studentExamId?: number;
  submittedAt: string;
  status: string;
}

@Component({
  selector: 'app-result-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-detail.html',
  styleUrl: './result-detail.scss'
})
export class ResultDetail implements OnInit {
  results: ResultDisplay[] = [];
  examTitle: string = '';
  examId: number = 0;
  loading: boolean = false;
  error: string = '';

  gradedCount: number = 0;
  submittedCount: number = 0;
  inProgressCount: number = 0;

  constructor(
    private studentExamService: StudentExamService,
    private examService: ExamService,
    private resultService: ResultService, // ✅ Inject ResultService
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.examId = +params['examId'];
      if (this.examId) {
        this.loadExamResults();
      }
    });
  }

  loadExamResults() {
    this.loading = true;
    this.error = '';

    this.studentExamService.getAllSubmittedExams().subscribe({
      next: (response: GenericResponseV2<StudentExamDto[]>) => {
        console.log('Full API Response:', response);

        if (response.status === 'SUCCESS' && response._embedded) {
          console.log('Embedded data:', response._embedded);

          const filteredExams = response._embedded.filter(exam => exam.examId === this.examId);
          console.log('Filtered exams for examId', this.examId, ':', filteredExams);

          if (filteredExams.length === 0) {
            this.loading = false;
            this.error = 'No results found for this exam';
            return;
          }

          const firstExam = filteredExams[0];
          console.log('First exam data:', firstExam);

          if (firstExam.examTitle && firstExam.examTitle !== 'null') {
            this.examTitle = firstExam.examTitle;
            this.processResults(filteredExams);
          } else {
            this.examService.getExamById(this.examId).subscribe({
              next: (examRes) => {
                this.examTitle = examRes._embedded?.title || 'Unknown Exam';
                this.processResults(filteredExams);
              },
              error: () => {
                this.examTitle = 'Unknown Exam';
                this.processResults(filteredExams);
              }
            });
          }
        } else {
          this.loading = false;
          this.error = 'No data received from server';
        }
      },
      error: (err) => {
        this.error = 'Failed to load results';
        this.loading = false;
        console.error('Error loading results:', err);
      }
    });
  }

  // ✅ Updated to fetch actual results using the endpoint
  processResults(exams: StudentExamDto[]) {
    console.log('Processing results:', exams);

    this.gradedCount = 0;
    this.submittedCount = 0;
    this.inProgressCount = 0;

    // ✅ Create array of promises to fetch results for each student exam
    const resultPromises = exams.map((exam, index) => {
      return new Promise<ResultDisplay>((resolve) => {
        const status = exam.status || 'SUBMITTED';

        // Update counts
        if (status === 'GRADED') {
          this.gradedCount++;
        } else if (status === 'SUBMITTED') {
          this.submittedCount++;
        } else if (status === 'IN_PROGRESS') {
          this.inProgressCount++;
        }

        // ✅ Fetch actual result from backend if exam has an ID
        if (exam.id && status === 'GRADED') {
          this.resultService.getResultByStudentExam(exam.id).subscribe({
            next: (resultResponse: GenericResponseV2<ResultDto>) => {
              if (resultResponse.status === 'SUCCESS' && resultResponse._embedded) {
                const result = resultResponse._embedded;
                const obtainedMarks = result.obtainedMarks || 0;
                const totalMarks = result.totalMarks || 0;
                const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : '0';

                console.log(`Fetched result for studentExamId ${exam.id}:`, result);

                resolve({
                  sno: index + 1,
                  studentName: exam.studentName || 'N/A',
                  regNo: exam.studentRegNo || 'N/A',
                  email: exam.studentEmail || 'N/A',
                  score: `${obtainedMarks}/${totalMarks}`,
                  percentage: `${percentage}%`,
                  examTitle: this.examTitle,
                  examId: exam.examId || 0,
                  studentExamId: exam.id,
                  submittedAt: exam.submittedAt ? this.formatDate(exam.submittedAt) : 'N/A',
                  status: status
                });
              } else {
                // Fallback if result not found
                this.resolveWithFallback(exam, index, status, resolve);
              }
            },
            error: (err) => {
              console.error(`Error fetching result for studentExamId ${exam.id}:`, err);
              this.resolveWithFallback(exam, index, status, resolve);
            }
          });
        } else {
          // Not graded yet, use fallback
          this.resolveWithFallback(exam, index, status, resolve);
        }
      });
    });

    // ✅ Wait for all results to be fetched
    Promise.all(resultPromises).then((results) => {
      this.results = results;
      console.log('Final results with actual marks:', this.results);
      console.log('Status counts:', {
        graded: this.gradedCount,
        submitted: this.submittedCount,
        inProgress: this.inProgressCount
      });
      this.loading = false;
    });
  }

  // ✅ Helper method for fallback data
  private resolveWithFallback(
    exam: StudentExamDto, 
    index: number, 
    status: string, 
    resolve: (value: ResultDisplay) => void
  ) {
    const obtainedMarks = exam.result?.obtainedMarks || 0;
    const totalMarks = exam.result?.totalMarks || 0;
    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : '0';

    resolve({
      sno: index + 1,
      studentName: exam.studentName || 'N/A',
      regNo: exam.studentRegNo || 'N/A',
      email: exam.studentEmail || 'N/A',
      score: exam.result ? `${obtainedMarks}/${totalMarks}` : 'Not Graded',
      percentage: exam.result ? `${percentage}%` : 'N/A',
      examTitle: this.examTitle,
      examId: exam.examId || 0,
      studentExamId: exam.id,
      submittedAt: exam.submittedAt ? this.formatDate(exam.submittedAt) : 'N/A',
      status: status
    });
  }

  goBack() {
    this.router.navigate(['/results']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'GRADED':
        return 'bg-success';
      case 'SUBMITTED':
        return 'bg-warning text-dark';
      case 'IN_PROGRESS':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  }
}