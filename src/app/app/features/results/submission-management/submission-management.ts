import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentExamService, StudentExamDto, GenericResponseV2, ResponseStatusEnum } from '../../../core/services/student.service.exam';
import { ResultService, ResultDto } from '../../../core/services/result.service'; // ✅ Added

interface Submission {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentRegNo: string;
  submittedAt: string;
  score: number | null;
  totalMarks: number;
  status: 'PENDING' | 'GRADED' | 'IN_REVIEW';
  answeredQuestions: number;
  totalQuestions: number;
  timeSpent: string;
  flaggedForReview: boolean;
  violations?: number;
}

interface Exam {
  id: number;
  title: string;
  subject: string;
  totalMarks: number;
  totalQuestions: number;
  startDate: string;
  endDate: string;
  duration: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
}

@Component({
  selector: 'app-submission-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './submission-management.html',
  styleUrls: ['./submission-management.scss']
})
export class SubmissionManagement implements OnInit {
  exams: Exam[] = [];
  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];

  selectedExam: Exam | null = null;
  selectedExamId: number | null = null;

  // Filters
  searchQuery = '';
  statusFilter: 'ALL' | 'PENDING' | 'GRADED' | 'IN_REVIEW' = 'ALL';
  activeFilter: 'ALL' | 'PENDING' | 'GRADED' | 'IN_REVIEW' | 'FLAGGED' = 'ALL';
  sortBy: 'submittedAt' | 'studentName' | 'studentRegNo' | 'score' = 'submittedAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  isLoading = false;
  viewMode: 'exams' | 'submissions' = 'exams';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studentExamService: StudentExamService,
    private resultService: ResultService // ✅ Added
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['examId']) {
        this.selectedExamId = +params['examId'];
        this.loadExamSubmissions(this.selectedExamId);
      } else {
        this.loadSubmittedExams();
      }
    });
  }

  loadSubmittedExams(): void {
    this.isLoading = true;
    this.viewMode = 'exams';

    this.studentExamService.getAllSubmittedExams().subscribe(
      (response) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.processSubmittedExams(response._embedded);
        } else {
          console.error('Failed to load submitted exams:', response.message);
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading submitted exams:', error);
        this.isLoading = false;
      }
    );
  }

  processSubmittedExams(studentExams: StudentExamDto[]): void {
    try {
      const examMap = new Map<number, Exam>();

      studentExams.forEach(studentExam => {
        if (!studentExam.examId) return;

        if (!examMap.has(studentExam.examId)) {
          examMap.set(studentExam.examId, {
            id: studentExam.examId,
            title: studentExam.examTitle || `Exam ${studentExam.examId}`,
            subject: studentExam.examSubject || 'General',
            totalMarks: 0,
            totalQuestions: 0,
            startDate: '',
            endDate: '',
            duration: studentExam.examDuration || 0,
            status: 'ACTIVE',
            totalSubmissions: 0,
            gradedSubmissions: 0,
            pendingSubmissions: 0
          });
        }

        const exam = examMap.get(studentExam.examId)!;
        exam.totalSubmissions++;

        if (studentExam.status === 'GRADED') {
          exam.gradedSubmissions++;
        } else if (studentExam.status === 'SUBMITTED') {
          exam.pendingSubmissions++;
        }
      });

      const examsArray = Array.from(examMap.values());
      
      let loadedCount = 0;
      examsArray.forEach(exam => {
        this.studentExamService.getStudentsByExam(exam.id).subscribe(
          (response) => {
            if (response.status === ResponseStatusEnum.SUCCESS && response._embedded && response._embedded.length > 0) {
              const firstSubmission = response._embedded[0];
              
              if (firstSubmission.id) {
                this.studentExamService.getStudentExam(firstSubmission.id).subscribe(
                  (detailResponse) => {
                    if (detailResponse.status === ResponseStatusEnum.SUCCESS && detailResponse._embedded) {
                      const detailed = detailResponse._embedded;
                      exam.totalQuestions = detailed.questions?.length || 0;
                      exam.totalMarks = detailed.examTotalMarks || 0;
                    }
                    
                    loadedCount++;
                    if (loadedCount === examsArray.length) {
                      this.exams = examsArray;
                    }
                  }
                );
              } else {
                loadedCount++;
                if (loadedCount === examsArray.length) {
                  this.exams = examsArray;
                }
              }
            } else {
              loadedCount++;
              if (loadedCount === examsArray.length) {
                this.exams = examsArray;
              }
            }
          },
          (error) => {
            console.error('Error loading exam details:', error);
            loadedCount++;
            if (loadedCount === examsArray.length) {
              this.exams = examsArray;
            }
          }
        );
      });

    } catch (error) {
      console.error('Error processing submitted exams:', error);
      this.exams = [];
    }
  }

  loadExamSubmissions(examId: number): void {
    this.isLoading = true;
    this.viewMode = 'submissions';
    this.selectedExamId = examId;

    this.studentExamService.getStudentsByExam(examId).subscribe(
      (response) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          const examSubmissions = response._embedded;
          const uniqueSubmissions = this.removeDuplicateSubmissions(examSubmissions);

          if (uniqueSubmissions.length > 0 && !this.selectedExam) {
            const firstSubmission = uniqueSubmissions[0];
            this.selectedExam = {
              id: examId,
              title: firstSubmission.examTitle || `Exam ${examId}`,
              subject: firstSubmission.examSubject || 'General',
              totalMarks: firstSubmission.examTotalMarks || 0,
              totalQuestions: firstSubmission.questions?.length || 0,
              startDate: '',
              endDate: '',
              duration: firstSubmission.examDuration || 0,
              status: 'ACTIVE',
              totalSubmissions: uniqueSubmissions.length,
              gradedSubmissions: uniqueSubmissions.filter(s => s.status === 'GRADED').length,
              pendingSubmissions: uniqueSubmissions.filter(s => s.status === 'SUBMITTED').length
            };
          }

          let loadedCount = 0;
          const detailedSubmissions: StudentExamDto[] = [];

          uniqueSubmissions.forEach(studentExam => {
            if (studentExam.id) {
              this.studentExamService.getStudentExam(studentExam.id).subscribe(
                (res) => {
                  if (res.status === ResponseStatusEnum.SUCCESS && res._embedded) {
                    const fullSubmission = res._embedded;
                    detailedSubmissions.push(fullSubmission);

                    if (this.selectedExam) {
                      this.selectedExam.totalMarks = Math.max(
                        this.selectedExam.totalMarks,
                        fullSubmission.examTotalMarks || 0
                      );
                      this.selectedExam.totalQuestions = Math.max(
                        this.selectedExam.totalQuestions,
                        fullSubmission.questions?.length || 0
                      );
                    }
                  }

                  loadedCount++;
                  if (loadedCount === uniqueSubmissions.length) {
                    this.mapToSubmissionsWithResults(detailedSubmissions);
                  }
                },
                (err) => {
                  console.error('Error loading submission details:', err);
                  loadedCount++;
                  if (loadedCount === uniqueSubmissions.length) {
                    this.mapToSubmissionsWithResults(detailedSubmissions);
                  }
                }
              );
            } else {
              loadedCount++;
              if (loadedCount === uniqueSubmissions.length) {
                this.mapToSubmissionsWithResults(detailedSubmissions);
              }
            }
          });
        } else {
          console.error('Failed to load exam submissions:', response.message);
          this.isLoading = false;
        }
      },
      (error) => {
        console.error('Error loading exam submissions:', error);
        this.isLoading = false;
      }
    );
  }

  // ✅ NEW METHOD: Fetch results for graded submissions
  mapToSubmissionsWithResults(studentExams: StudentExamDto[]): void {
    const mappedSubmissions: Submission[] = [];
    let processedCount = 0;

    studentExams.forEach(se => {
      const baseSubmission: Submission = {
        id: se.id || 0,
        studentId: se.studentId || 0,
        studentName: se.studentName || 'Unknown Student',
        studentEmail: se.studentEmail || '',
        studentRegNo: se.studentRegNo || 'N/A',
        submittedAt: se.submittedAt || '',
        score: null,
        totalMarks: se.examTotalMarks || 0,
        status: this.mapExamStatusToSubmissionStatus(se.status || 'SUBMITTED'),
        answeredQuestions: se.answers?.length || 0,
        totalQuestions: se.questions?.length || 0,
        timeSpent: this.calculateTimeSpent(se.startedAt, se.submittedAt),
        flaggedForReview: (se.violations?.length || 0) > 0,
        violations: se.violations?.length || 0
      };

      // ✅ Fetch actual result for GRADED submissions
      if (se.status === 'GRADED' && se.id) {
        this.resultService.getResultByStudentExam(se.id).subscribe({
          next: (resultResponse: GenericResponseV2<ResultDto>) => {
            if (resultResponse.status === 'SUCCESS' && resultResponse._embedded) {
              baseSubmission.score = resultResponse._embedded.obtainedMarks;
              baseSubmission.totalMarks = resultResponse._embedded.totalMarks;
            }
            mappedSubmissions.push(baseSubmission);
            processedCount++;
            
            if (processedCount === studentExams.length) {
              this.submissions = mappedSubmissions;
              this.applyFilters();
              this.isLoading = false;
            }
          },
          error: () => {
            mappedSubmissions.push(baseSubmission);
            processedCount++;
            
            if (processedCount === studentExams.length) {
              this.submissions = mappedSubmissions;
              this.applyFilters();
              this.isLoading = false;
            }
          }
        });
      } else {
        mappedSubmissions.push(baseSubmission);
        processedCount++;
        
        if (processedCount === studentExams.length) {
          this.submissions = mappedSubmissions;
          this.applyFilters();
          this.isLoading = false;
        }
      }
    });
  }

  loadDetailedSubmissions(studentExams: StudentExamDto[]): void {
    if (studentExams.length === 0) {
      this.submissions = [];
      this.applyFilters();
      this.isLoading = false;
      return;
    }

    const uniqueStudentExams = this.removeDuplicateSubmissions(studentExams);

    let loadedCount = 0;
    const detailedSubmissions: StudentExamDto[] = [];

    uniqueStudentExams.forEach(studentExam => {
      if (studentExam.id) {
        this.studentExamService.getStudentExam(studentExam.id).subscribe(
          (response) => {
            if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
              detailedSubmissions.push(response._embedded);
            }

            loadedCount++;
            if (loadedCount === uniqueStudentExams.length) {
              this.mapToSubmissionsWithResults(detailedSubmissions);
            }
          },
          (error) => {
            console.error('Error loading submission details:', error);
            loadedCount++;
            if (loadedCount === uniqueStudentExams.length) {
              this.mapToSubmissionsWithResults(detailedSubmissions);
            }
          }
        );
      } else {
        loadedCount++;
        if (loadedCount === uniqueStudentExams.length) {
          this.mapToSubmissionsWithResults(detailedSubmissions);
        }
      }
    });
  }

  removeDuplicateSubmissions(studentExams: StudentExamDto[]): StudentExamDto[] {
    const uniqueMap = new Map<number, StudentExamDto>();
    
    studentExams.forEach(exam => {
      if (exam.id && !uniqueMap.has(exam.id)) {
        uniqueMap.set(exam.id, exam);
      }
    });
    
    return Array.from(uniqueMap.values());
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

  selectExam(exam: Exam): void {
    this.loadExamSubmissions(exam.id);
  }

  backToExams(): void {
    this.viewMode = 'exams';
    this.selectedExam = null;
    this.selectedExamId = null;
    this.submissions = [];
    this.filteredSubmissions = [];
    this.activeFilter = 'ALL';
    this.searchQuery = '';
    this.loadSubmittedExams();
  }

  isValidFilter(value: string): value is 'ALL' | 'PENDING' | 'GRADED' | 'IN_REVIEW' | 'FLAGGED' {
    return ['ALL', 'PENDING', 'GRADED', 'IN_REVIEW', 'FLAGGED'].includes(value);
  }

  setActiveFilter(filter: string): void {
    if (!this.isValidFilter(filter)) {
      console.error('Invalid filter value:', filter);
      return;
    }
    
    this.activeFilter = filter;
    
    if (filter === 'FLAGGED') {
      this.statusFilter = 'ALL';
    } else {
      this.statusFilter = filter;
    }
    
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.submissions];

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(s => s.status === this.statusFilter);
    }

    if (this.activeFilter === 'FLAGGED') {
      filtered = filtered.filter(s => s.flaggedForReview);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.studentName.toLowerCase().includes(query) ||
        s.studentEmail.toLowerCase().includes(query) ||
        s.studentRegNo.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'submittedAt':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case 'studentName':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'studentRegNo':
          comparison = a.studentRegNo.localeCompare(b.studentRegNo);
          break;
        case 'score':
          const scoreA = a.score ?? -1;
          const scoreB = b.score ?? -1;
          comparison = scoreA - scoreB;
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredSubmissions = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.activeFilter = 'ALL';
    this.applyFilters();
  }

  gradeSubmission(submission: Submission): void {
    if (this.selectedExamId) {
      this.router.navigate(['/submissions/exam', this.selectedExamId, 'submission', submission.id]);
    }
  }

  viewSubmissionDetails(submission: Submission): void {
    if (this.selectedExamId) {
      this.router.navigate(['/submissions/exam', this.selectedExamId, 'submission', submission.id]);
    }
  }

  exportToCSV(): void {
    if (!this.selectedExam) return;

    const headers = ['#', 'Reg No', 'Student Name', 'Email', 'Submitted At', 'Status', 'Score', 'Questions Answered', 'Time Spent', 'Flagged'];
    const rows = this.filteredSubmissions.map((s, index) => [
      (index + 1).toString(),
      s.studentRegNo,
      s.studentName,
      s.studentEmail,
      s.submittedAt,
      s.status,
      s.score !== null ? s.score.toString() : 'Not Graded',
      `${s.answeredQuestions}/${s.totalQuestions}`,
      s.timeSpent,
      s.flaggedForReview ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.selectedExam.title}_submissions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-warning text-dark';
      case 'GRADED': return 'bg-success';
      case 'IN_REVIEW': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getExamStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-success';
      case 'COMPLETED': return 'bg-primary';
      case 'DRAFT': return 'bg-secondary';
      case 'ARCHIVED': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }

  getGradingProgress(exam: Exam): number {
    if (exam.totalSubmissions === 0) return 0;
    return Math.round((exam.gradedSubmissions / exam.totalSubmissions) * 100);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActiveExamsCount(): number {
    return this.exams.filter(e => e.status === 'ACTIVE').length;
  }

  getTotalSubmissionsCount(): number {
    return this.exams.reduce((sum, e) => sum + e.totalSubmissions, 0);
  }

  getTotalPendingCount(): number {
    return this.exams.reduce((sum, e) => sum + e.pendingSubmissions, 0);
  }

  getAverageScore(): number {
    const gradedSubmissions = this.submissions.filter(s => s.score !== null);
    if (gradedSubmissions.length === 0) return 0;

    const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
    const totalMarks = gradedSubmissions.reduce((sum, s) => sum + s.totalMarks, 0);

    return totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  }

  getPendingSubmissionsCount(): number {
    return this.submissions.filter(s => s.status === 'PENDING').length;
  }

  getGradedSubmissionsCount(): number {
    return this.submissions.filter(s => s.status === 'GRADED').length;
  }

  getInReviewCount(): number {
    return this.submissions.filter(s => s.status === 'IN_REVIEW').length;
  }

  getFlaggedSubmissionsCount(): number {
    return this.submissions.filter(s => s.flaggedForReview).length;
  }
}