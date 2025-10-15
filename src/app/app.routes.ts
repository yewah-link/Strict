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
import { ResultList } from './app/features/results/result-list/result-list';
import { ResultDetail } from './app/features/results/result-detail/result-detail';

export const routes: Routes = [
  // Public Routes
  { path: '', component: Homepage },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // Student Dashboard
  { path: 'student-dashboard', component: StudentDashboard },

  // Examiner Dashboard Layout Wrapper
  {
    path: '',
    component: ExaminerDashboard,
    children: [
      { path: 'examiner-dashboard', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ExamList },

      // Exam Management Routes
      { path: 'exams/create', component: ExamCreate },
      { path: 'exams/:id/edit', component: ExamCreate },
      { path: 'exams/:id', component: ExamDetail },
      { path: 'exams', component: ExamList },

      // Question Management
      { path: 'exams/:examId/questions/create', component: QuestionCreate },
      { path: 'exams/:examId/questions/:questionId/edit', component: QuestionCreate },
      { path: 'exams/:examId/questions', component: QuestionList },

      // Submission and Grading
      { path: 'submissions/exam/:examId/submission/:submissionId', component: GradeSubmission },
      { path: 'submissions/exam/:examId', component: SubmissionManagement },
      { path: 'submissions', component: SubmissionManagement },

      // Proctoring
      { path: 'proctoring/session/:sessionId', component: ProctoringSession },
      { path: 'proctoring', component: ProctorExamSelection },

      // Results
      { path: 'results', component: ResultList },
      { path: 'result/detail' ,component : ResultDetail},
    ]
  },

  // Student Exam Routes
  { path: 'student/exam/take', component: ExamTake },
  { path: 'student/exam/:id/take', component: ExamTake },
  { path: 'student/results', component: ExamStatus },

  // Fallback
  { path: '**', redirectTo: '' }
];
