import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { ResponseStatusEnum } from '../../../core/services/auth.services';
import { ProctoringSessionDto, StreamStatus, ProctoringService } from '../../../core/services/proctoring.service';

@Component({
  selector: 'app-proctoring-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proctoring-session.html',
  styleUrls: ['./proctoring-session.scss']
})
export class ProctoringSession implements OnInit, OnDestroy {
  session: ProctoringSessionDto | null = null;
  sessionId!: number;
  examId!: number;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  activeTabs: string[] = [];
  showEndSessionModal = false;

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
      
      // Get examId from navigation state
      const navigation = this.router.getCurrentNavigation();
      this.examId = navigation?.extras?.state?.['examId'] || history.state?.examId;
      
      if (this.sessionId && this.examId) {
        this.loadSessionDetails();
        this.startAutoRefresh();
      } else if (this.sessionId && !this.examId) {
        // Fallback: try to get all sessions and find this one
        this.loadSessionByIdFallback();
      } else {
        this.errorMessage = 'Invalid session ID';
        this.router.navigate(['/proctoring']);
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  startAutoRefresh() {
    // Refresh session status every 5 seconds
    this.refreshSubscription = interval(5000).subscribe(() => {
      this.loadSessionDetails(true); // Silent refresh
      this.loadActiveTabs();
    });
  }

  stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadSessionDetails(silent: boolean = false) {
    if (!silent) {
      this.isLoading = true;
    }
    this.errorMessage = '';

    // Use examId to get the active session
    this.proctoringService.getActiveSessionByExamId(this.examId).subscribe({
      next: (response) => {
        if (!silent) {
          this.isLoading = false;
        }
        
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.session = response._embedded;
          
          // Verify this is the correct session
          if (this.session.id !== this.sessionId) {
            this.errorMessage = 'Session mismatch. Redirecting...';
            setTimeout(() => {
              this.router.navigate(['/proctoring']);
            }, 2000);
            return;
          }
          
          this.syncMonitoringStates();
        } else {
          if (!silent) {
            this.errorMessage = 'No active session found. Redirecting to exam selection...';
            setTimeout(() => {
              this.router.navigate(['/proctoring']);
            }, 3000);
          }
        }
      },
      error: (error) => {
        if (!silent) {
          this.isLoading = false;
          this.errorMessage = 'Failed to load session details';
          console.error('Error loading session:', error);
          
          setTimeout(() => {
            this.router.navigate(['/proctoring']);
          }, 3000);
        }
      }
    });
  }

  // Fallback method if examId is not available
  loadSessionByIdFallback() {
    this.isLoading = true;
    
    // Get all sessions and find the one with matching sessionId
    this.proctoringService.getAllSessions().subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          const foundSession = response._embedded.find(s => s.id === this.sessionId);
          
          if (foundSession && foundSession.examId) {
            this.examId = foundSession.examId;
            this.session = foundSession;
            this.syncMonitoringStates();
            this.startAutoRefresh();
          } else {
            this.errorMessage = 'Session not found. Redirecting...';
            setTimeout(() => {
              this.router.navigate(['/proctoring']);
            }, 2000);
          }
        } else {
          this.errorMessage = 'Failed to load session';
          setTimeout(() => {
            this.router.navigate(['/proctoring']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load sessions';
        console.error('Error:', error);
        setTimeout(() => {
          this.router.navigate(['/proctoring']);
        }, 3000);
      }
    });
  }

  syncMonitoringStates() {
    if (this.session) {
      this.isAudioActive = this.session.audioMonitoringActive || false;
      this.isScreenActive = this.session.screenMonitoringActive || false;
      this.arePoliciesEnforced = this.session.browserPoliciesEnforced || false;
    }
  }

  loadActiveTabs() {
    this.proctoringService.getActiveTabs(this.sessionId).subscribe({
      next: (response) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.activeTabs = response._embedded;
        }
      },
      error: (error) => {
        console.error('Failed to load active tabs:', error);
      }
    });
  }

  endSession() {
    this.showEndSessionModal = true;
  }

  closeEndSessionModal() {
    this.showEndSessionModal = false;
  }

  confirmEndSession() {
    this.showEndSessionModal = false;
    this.proctoringService.endProctoringSession(this.sessionId).subscribe({
      next: (response) => {
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

  pauseSession() {
    this.proctoringService.pauseProctoringSession(this.sessionId).subscribe({
      next: (response) => {
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
      next: (response) => {
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
        next: (response) => {
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
        next: (response) => {
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
        next: (response) => {
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
        next: (response) => {
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
      next: (response) => {
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

  backToExamSelection() {
    this.stopAutoRefresh();
    this.router.navigate(['/proctoring']);
  }

  getStatusBadgeClass(): string {
    if (!this.session) return 'bg-secondary';

    switch (this.session.status) {
      case StreamStatus.ACTIVE:
        return 'bg-success';
      case StreamStatus.PAUSED:
        return 'bg-warning';
      case StreamStatus.DISCONNECTED:
        return 'bg-danger';
      case StreamStatus.INACTIVE:
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }
}