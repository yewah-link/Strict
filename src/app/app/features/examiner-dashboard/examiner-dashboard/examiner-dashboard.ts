import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface PendingSubmission {
  id: number;
  examId: number;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  answeredQuestions: number;
  totalQuestions: number;
}

interface ExamRequiringAttention {
  id: number;
  title: string;
  deadline: string;
  totalSubmissions: number;
  gradedCount: number;
  pendingCount: number;
  gradedPercentage: number;
  pendingPercentage: number;
}

interface UserInfo {
  email: string;
  fullName?: string;
  username?: string;
  role?: string;
  regNo?: string;
}

@Component({
  selector: 'app-examiner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './examiner-dashboard.html',
  styleUrls: ['./examiner-dashboard.scss']
})
export class ExaminerDashboard implements OnInit {
  isSidebarOpen = true;
  activeSection = 'dashboard';
  pendingSubmissions: PendingSubmission[] = [];
  examsRequiringAttention: ExamRequiringAttention[] = [];
  userInfo: UserInfo = { email: 'examiner@edu.com' };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDashboardData();

    // Set active section based on current route
    this.updateActiveSectionFromRoute(this.router.url);

    // Listen to route changes to update active section
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateActiveSectionFromRoute(event.urlAfterRedirects);
      });
  }

  loadUserInfo(): void {
    // Get user info from localStorage
    const userEmail = localStorage.getItem('userEmail');
    const fullName = localStorage.getItem('userName');
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');
    const regNo = localStorage.getItem('regNo');

    if (userEmail) {
      this.userInfo = {
        email: userEmail,
        fullName: fullName || undefined,
        username: username || undefined,
        role: userRole || undefined,
        regNo: regNo || undefined
      };
    }
  }

  getUserInitial(): string {
    // Priority: fullName > username > email
    if (this.userInfo.fullName) {
      return this.userInfo.fullName.charAt(0).toUpperCase();
    }
    if (this.userInfo.username) {
      return this.userInfo.username.charAt(0).toUpperCase();
    }
    return this.userInfo.email.charAt(0).toUpperCase();
  }

  getDisplayName(): string {
    // Priority: fullName > username > role-based default
    if (this.userInfo.fullName) {
      return this.userInfo.fullName;
    }
    if (this.userInfo.username) {
      return this.userInfo.username;
    }
    return this.userInfo.role === 'EXAMINER' ? 'Examiner' : 'User';
  }

  getRoleDisplay(): string {
    if (this.userInfo.role === 'EXAMINER') {
      return 'Examiner';
    } else if (this.userInfo.role === 'STUDENT') {
      return 'Student';
    }
    return 'User';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  logout(): void {
    // Clear all localStorage
    localStorage.clear();

    // Navigate to login
    this.router.navigate(['/login']);
  }

  loadDashboardData(): void {
    // Mock data for pending submissions
    this.pendingSubmissions = [
      {
        id: 1,
        examId: 1,
        examTitle: 'Mathematics Final Exam',
        studentName: 'John Doe',
        studentEmail: 'john.doe@example.com',
        submittedAt: '2 hours ago',
        answeredQuestions: 20,
        totalQuestions: 20
      },
      {
        id: 3,
        examId: 1,
        examTitle: 'Mathematics Final Exam',
        studentName: 'Bob Johnson',
        studentEmail: 'bob.johnson@example.com',
        submittedAt: '5 hours ago',
        answeredQuestions: 18,
        totalQuestions: 20
      },
      {
        id: 6,
        examId: 2,
        examTitle: 'Physics Midterm',
        studentName: 'Emma Davis',
        studentEmail: 'emma.davis@example.com',
        submittedAt: '1 day ago',
        answeredQuestions: 15,
        totalQuestions: 15
      }
    ];

    // Mock data for exams requiring attention
    this.examsRequiringAttention = [
      {
        id: 1,
        title: 'Mathematics Final Exam',
        deadline: 'Due in 2 days',
        totalSubmissions: 45,
        gradedCount: 30,
        pendingCount: 15,
        gradedPercentage: 67,
        pendingPercentage: 33
      },
      {
        id: 2,
        title: 'Physics Midterm',
        deadline: 'Due tomorrow',
        totalSubmissions: 32,
        gradedCount: 20,
        pendingCount: 12,
        gradedPercentage: 63,
        pendingPercentage: 37
      }
    ];
  }

  private updateActiveSectionFromRoute(url: string): void {
    if (url.includes('/exams/create') || (url.includes('/exams/') && url.includes('/edit'))) {
      this.activeSection = 'create-exam';
    } else if (url.includes('/exams')) {
      this.activeSection = 'manage-exams';
    } else if (url.includes('/submissions')) {
      this.activeSection = 'submissions';
    } else if (url.includes('/proctoring')) {
      this.activeSection = 'proctoring';
    } else if (url.includes('/results')) {
      this.activeSection = 'results';
    } else if (url.includes('/analytics')) {
      this.activeSection = 'analytics';
    } else if (url.includes('/examiner-dashboard')) {
      this.activeSection = 'dashboard';
    }
  }
}
