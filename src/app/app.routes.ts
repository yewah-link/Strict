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

  // Question Management Routes
  { path: 'exams/:examId/questions', component: QuestionList },
  { path: 'exams/:examId/questions/create', component: QuestionCreate },
  { path: 'exams/:examId/questions/:questionId/edit', component: QuestionCreate },

  // Fallback
  { path: '**', redirectTo: '' }
];
