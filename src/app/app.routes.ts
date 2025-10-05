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

export const routes: Routes = [
  { path: '', component: Homepage },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // Dashboards
  { path: 'student-dashboard', component: StudentDashboard },
  { path: 'examiner-dashboard', component: ExaminerDashboard },

  // Exam Management Routes
  { path: 'exams', component: ExamList },
  { path: 'exams/create', component: ExamCreate },
  { path: 'exams/:id', component: ExamDetail },
  { path: 'exams/:id/edit', component: ExamCreate },

  // Student Exam Routes (order matters - more specific routes first!)
  { path: 'exam-take', component: ExamTake },  // For link/session ID input
  { path: 'exam-take/:id', component: ExamTake },  // For direct exam access
  { path: 'exam-status/:id', component: ExamStatus },

  // Question Management Routes
  { path: 'exams/:examId/questions', component: QuestionList },
  { path: 'exams/:examId/questions/create', component: QuestionCreate },
  { path: 'exams/:examId/questions/:questionId/edit', component: QuestionCreate },

  // Proctoring Routes (UPDATED - order matters!)
  { path: 'proctoring', component: ProctorExamSelection },  // Exam selection page
  { path: 'proctoring/session/:sessionId', component: ProctoringSession },  // Active session

  // Fallback
  { path: '**', redirectTo: '' }
];