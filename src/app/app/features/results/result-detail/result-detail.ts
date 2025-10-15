import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentExamService, StudentExamDto, GenericResponseV2 } from '../../../core/services/student.service.exam';
import { ExamService } from '../../../core/services/exam.service';

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

  constructor(
    private studentExamService: StudentExamService,
    private examService: ExamService,
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

          // Filter exams for this specific examId
          const filteredExams = response._embedded.filter(exam => exam.examId === this.examId);
          console.log('Filtered exams for examId', this.examId, ':', filteredExams);

          if (filteredExams.length === 0) {
            this.loading = false;
            this.error = 'No results found for this exam';
            return;
          }

          // Get exam title from first result
          const firstExam = filteredExams[0];
          console.log('First exam data:', firstExam);

          if (firstExam.examTitle && firstExam.examTitle !== 'null') {
            this.examTitle = firstExam.examTitle;
            this.processResults(filteredExams);
          } else {
            // Fetch exam title from API if not in response
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

  processResults(exams: StudentExamDto[]) {
    console.log('Processing results:', exams);

    this.results = exams.map((exam, index) => {
      console.log(`Processing exam ${index}:`, {
        studentName: exam.studentName,
        studentEmail: exam.studentEmail,
        studentRegNo: exam.studentRegNo,
        result: exam.result
      });

      const obtainedMarks = exam.result?.obtainedMarks || 0;
      const totalMarks = exam.result?.totalMarks || 0;
      const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : '0';

      return {
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
        status: exam.status || 'SUBMITTED'
      };
    });

    console.log('Final results:', this.results);
    this.loading = false;
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
      case 'GRADED': return 'bg-success';
      case 'SUBMITTED': return 'bg-warning';
      case 'IN_PROGRESS': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}
