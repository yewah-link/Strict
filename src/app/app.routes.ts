import { Routes } from '@angular/router';
import { Homepage } from './app/shared/components/homepage/homepage';
import { Signup } from './app/features/auth/signup/signup';
import { Login } from './app/features/auth/login/login';
import { ExaminerDashboard } from './app/features/examiner-dashboard/examiner-dashboard/examiner-dashboard';
import { StudentDashboard } from './app/features/student-dashboard/student-dashboard/student-dashboard';
import { ExamCreate } from './app/features/exams/exam-create/exam-create';
import { ExamList } from './app/features/exams/exam-list/exam-list';
import { ExamDetail } from './app/features/exams/exam-detail/exam-detail';
import { QuestionList } from './app/features/questions/question-list/question-list';
import { QuestionCreate } from './app/features/questions/question-create/question-create';
import { ProctoringSession } from './app/features/proctoring/proctoring-session/proctoring-session';
import { ProctorExamSelection } from './app/features/proctoring/proctor-exam-selection/proctor-exam-selection';
import { ExamStatus } from './app/features/student-exams/exam-status/exam-status';
import { ExamTake } from './app/features/student-exams/exam-take/exam-take';
import { SubmissionManagement } from './app/features/results/submission-management/submission-management';
import { GradeSubmission } from './app/features/results/grade-submission/grade-submission';

export const routes: Routes = [
  // Public Routes
  { path: '', component: Homepage },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // Dashboards
  { path: 'student-dashboard', component: StudentDashboard },
  { path: 'examiner-dashboard', component: ExaminerDashboard },

  // ===== EXAMINER ROUTES =====

  // Exam Management Routes
  { path: 'exams/create', component: ExamCreate },
  { path: 'exams/:id/edit', component: ExamCreate },
  { path: 'exams/:id', component: ExamDetail },
  { path: 'exams', component: ExamList },

  // Question Management Routes
  { path: 'exams/:examId/questions/create', component: QuestionCreate },
  { path: 'exams/:examId/questions/:questionId/edit', component: QuestionCreate },
  { path: 'exams/:examId/questions', component: QuestionList },

  // Submission and Grading Routes
  { path: 'submissions/exam/:examId/submission/:submissionId', component: GradeSubmission },
  { path: 'submissions/exam/:examId', component: SubmissionManagement },
  { path: 'submissions', component: SubmissionManagement },

  // Proctoring Routes
  { path: 'proctoring/session/:sessionId', component: ProctoringSession },
  { path: 'proctoring', component: ProctorExamSelection },

  // ===== STUDENT ROUTES =====

  { path: 'student/exam/take', component: ExamTake },


  // Take exam (landing to input code/session)
  { path: 'student/exam/take', component: ExamTake },

  // Take exam with ID
  { path: 'student/exam/:id/take', component: ExamTake },

  // View Results
  { path: 'student/results', component: ExamStatus },

  // Fallback
  { path: '**', redirectTo: '' }
];
