import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

interface ExamGroup {
  examId: number;
  examTitle: string;
  resultCount: number;
  gradedCount: number;
  submittedCount: number;
  inProgressCount: number;
}

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-list.html',
  styleUrl: './result-list.scss'
})
export class ResultList implements OnInit {
  results: ResultDisplay[] = [];
  examGroups: ExamGroup[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(
    private studentExamService: StudentExamService,
    private examService: ExamService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadResults();
  }

  loadResults() {
    this.loading = true;
    this.error = '';

    this.studentExamService.getAllSubmittedExams().subscribe({
      next: (response: GenericResponseV2<StudentExamDto[]>) => {
        if (response.status === 'SUCCESS' && response._embedded) {
          const examDetailsCache: Record<number, string> = {};

          const fetchExamTitle = (examId: number): Promise<string> => {
            if (examDetailsCache[examId]) {
              return Promise.resolve(examDetailsCache[examId]);
            }
            return new Promise((resolve) => {
              this.examService.getExamById(examId).subscribe({
                next: (res) => {
                  const title = res._embedded?.title || 'Unknown Exam';
                  examDetailsCache[examId] = title;
                  resolve(title);
                },
                error: () => resolve('Unknown Exam')
              });
            });
          };

          const promises = response._embedded.map(async (exam, index) => {
            const obtainedMarks = exam.result?.obtainedMarks || 0;
            const totalMarks = exam.result?.totalMarks || 0;
            const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : '0';

            const examTitle = exam.examTitle && exam.examTitle !== 'null'
              ? exam.examTitle
              : await fetchExamTitle(exam.examId || 0);

            return {
              sno: index + 1,
              studentName: exam.studentName || 'N/A',
              regNo: exam.studentRegNo || 'N/A',
              email: exam.studentEmail || 'N/A',
              score: exam.result ? `${obtainedMarks}/${totalMarks}` : 'Not Graded',
              percentage: exam.result ? `${percentage}%` : 'N/A',
              examTitle,
              examId: exam.examId || 0,
              studentExamId: exam.id,
              submittedAt: exam.submittedAt ? this.formatDate(exam.submittedAt) : 'N/A',
              status: exam.status || 'SUBMITTED'
            };
          });

          Promise.all(promises).then((finalResults) => {
            this.results = finalResults;
            this.groupResultsByExam();
            this.loading = false;
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load results';
        this.loading = false;
        console.error('Error loading results:', err);
      }
    });
  }

  groupResultsByExam() {
    const examMap = new Map<number, {
      title: string;
      count: number;
      graded: number;
      submitted: number;
      inProgress: number;
    }>();

    this.results.forEach(result => {
      if (examMap.has(result.examId)) {
        const existing = examMap.get(result.examId)!;
        existing.count++;

        if (result.status === 'GRADED') {
          existing.graded++;
        } else if (result.status === 'SUBMITTED') {
          existing.submitted++;
        } else if (result.status === 'IN_PROGRESS') {
          existing.inProgress++;
        }
      } else {
        examMap.set(result.examId, {
          title: result.examTitle,
          count: 1,
          graded: result.status === 'GRADED' ? 1 : 0,
          submitted: result.status === 'SUBMITTED' ? 1 : 0,
          inProgress: result.status === 'IN_PROGRESS' ? 1 : 0
        });
      }
    });

    this.examGroups = Array.from(examMap.entries()).map(([examId, data]) => ({
      examId,
      examTitle: data.title,
      resultCount: data.count,
      gradedCount: data.graded,
      submittedCount: data.submitted,
      inProgressCount: data.inProgress
    }));
  }

  viewExamDetails(examId: number) {
    this.router.navigate(['result/detail'], { queryParams: { examId } });
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
}
