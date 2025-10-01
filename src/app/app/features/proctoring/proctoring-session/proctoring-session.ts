import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import {
  ProctoringService,
  ProctoringSessionDto,
  ResponseStatusEnum,
  StreamStatus
} from '../../../core/services/proctoring.services'; // ✅ Correct import

@Component({
  selector: 'app-proctoring-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proctoring-session.html',
  styleUrls: ['./proctoring-session.scss'] // ✅ FIXED (plural styleUrls)
})
export class ProctoringSession implements OnInit, OnDestroy {
  session: ProctoringSessionDto | null = null;
  sessionId!: number;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  activeTabs: string[] = [];

  // Monitoring states
  isVideoActive = false;
  isAudioActive = false;
  isScreenActive = false;
  arePoliciesEnforced = false;

  // Auto-refresh subscription
  private refreshSubscription?: Subscription;

  StreamStatus = StreamStatus;

  constructor(
    private proctoringService: ProctoringService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.sessionId = +params['sessionId'];
      if (this.sessionId) {
        this.loadSessionStatus();
        this.startAutoRefresh();
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  startAutoRefresh() {
    // Refresh session status every 5 seconds
    this.refreshSubscription = interval(5000).subscribe(() => {
      this.loadSessionStatus(true); // Silent refresh
      this.loadActiveTabs();
    });
  }

  stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadSessionStatus(silent: boolean = false) {
    if (!silent) {
      this.isLoading = true;
    }

    this.proctoringService.getSessionStatus(this.sessionId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS) {
          // ✅ You can update session state here if needed
        }
      },
      error: () => {
        this.isLoading = false;
        if (!silent) {
          this.errorMessage = 'Failed to load session status';
        }
      }
    });
  }

  loadActiveTabs() {
    this.proctoringService.getActiveTabs(this.sessionId).subscribe({
      next: (response: any) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.activeTabs = response._embedded;
        }
      },
      error: (error: any) => {
        console.error('Failed to load active tabs:', error);
      }
    });
  }

  startSession() {
    const studentExamId = 1; // TODO: Replace with actual value
    const proctorId = 1; // TODO: Replace with actual value

    this.proctoringService.startProctoringSession(studentExamId, proctorId).subscribe({
      next: (response: any) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.session = response._embedded;
          this.successMessage = 'Proctoring session started successfully';
          setTimeout(() => (this.successMessage = ''), 3000);
        } else {
          this.errorMessage = response.message || 'Failed to start session';
        }
      },
      error: () => {
        this.errorMessage = 'Failed to start proctoring session';
      }
    });
  }

  endSession() {
    if (confirm('Are you sure you want to end this proctoring session?')) {
      this.proctoringService.endProctoringSession(this.sessionId).subscribe({
        next: (response: any) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.successMessage = 'Session ended successfully';
            this.stopAutoRefresh();
            setTimeout(() => this.router.navigate(['/proctoring']), 2000);
          } else {
            this.errorMessage = response.message || 'Failed to end session';
          }
        },
        error: () => {
          this.errorMessage = 'Failed to end session';
        }
      });
    }
  }

  pauseSession() {
    this.proctoringService.pauseProctoringSession(this.sessionId).subscribe({
      next: (response: any) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.session = response._embedded;
          this.successMessage = 'Session paused';
          setTimeout(() => (this.successMessage = ''), 3000);
        } else {
          this.errorMessage = response.message || 'Failed to pause session';
        }
      },
      error: () => {
        this.errorMessage = 'Failed to pause session';
      }
    });
  }

  resumeSession() {
    this.proctoringService.resumeProctoringSession(this.sessionId).subscribe({
      next: (response: any) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.session = response._embedded;
          this.successMessage = 'Session resumed';
          setTimeout(() => (this.successMessage = ''), 3000);
        } else {
          this.errorMessage = response.message || 'Failed to resume session';
        }
      },
      error: () => {
        this.errorMessage = 'Failed to resume session';
      }
    });
  }

  toggleAudioMonitoring() {
    if (this.isAudioActive) {
      this.proctoringService.stopAudioMonitoring(this.sessionId).subscribe({
        next: (response: any) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.isAudioActive = false;
            this.successMessage = 'Audio monitoring stopped';
            setTimeout(() => (this.successMessage = ''), 3000);
          }
        },
        error: () => {
          this.errorMessage = 'Failed to stop audio monitoring';
        }
      });
    } else {
      this.proctoringService.startAudioMonitoring(this.sessionId).subscribe({
        next: (response: any) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.isAudioActive = true;
            this.successMessage = 'Audio monitoring started';
            setTimeout(() => (this.successMessage = ''), 3000);
          }
        },
        error: () => {
          this.errorMessage = 'Failed to start audio monitoring';
        }
      });
    }
  }

  toggleScreenMonitoring() {
    if (this.isScreenActive) {
      this.proctoringService.stopScreenMonitoring(this.sessionId).subscribe({
        next: (response: any) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.isScreenActive = false;
            this.successMessage = 'Screen monitoring stopped';
            setTimeout(() => (this.successMessage = ''), 3000);
          }
        },
        error: () => {
          this.errorMessage = 'Failed to stop screen monitoring';
        }
      });
    } else {
      this.proctoringService.startScreenMonitoring(this.sessionId).subscribe({
        next: (response: any) => {
          if (response.status === ResponseStatusEnum.SUCCESS) {
            this.isScreenActive = true;
            this.successMessage = 'Screen monitoring started';
            setTimeout(() => (this.successMessage = ''), 3000);
          }
        },
        error: () => {
          this.errorMessage = 'Failed to start screen monitoring';
        }
      });
    }
  }

  enforceBrowserPolicies() {
    this.proctoringService.enforceBrowserPolicies(this.sessionId).subscribe({
      next: (response: any) => {
        if (response.status === ResponseStatusEnum.SUCCESS) {
          this.arePoliciesEnforced = true;
          this.successMessage = 'Browser policies enforced';
          setTimeout(() => (this.successMessage = ''), 3000);
        } else {
          this.errorMessage = response.message || 'Failed to enforce policies';
        }
      },
      error: () => {
        this.errorMessage = 'Failed to enforce browser policies';
      }
    });
  }

  getStatusBadgeClass(): string {
    if (!this.session) return 'bg-secondary';

    switch (this.session.status) {
      case StreamStatus.ACTIVE:
        return 'bg-success';
      case StreamStatus.PAUSED:
        return 'bg-warning';
      case StreamStatus.ENDED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}
