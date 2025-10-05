import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Enums
export enum StreamStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DISCONNECTED = 'DISCONNECTED',
  INACTIVE = 'INACTIVE'
}

export enum ResponseStatusEnum {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  ERROR = 'ERROR'
}

// DTOs
export interface ViolationLogDto {
  id?: number;
  sessionId: number;
  violationType: string;
  description: string;
  timestamp: string;
  severity?: string;
}

export interface ProctoringSessionDto {
  id?: number;
  examId: number;
  examTitle?: string;
  examCode?: string;
  proctorId: number;
  proctorName?: string;
  status: StreamStatus;
  videoStreamUrl?: string;
  audioStreamUrl?: string;
  screenShareUrl?: string;
  startTime?: string;
  endTime?: string;
  audioMonitoringActive?: boolean;
  screenMonitoringActive?: boolean;
  browserPoliciesEnforced?: boolean;
  flags?: string[];
  activeTabs?: string[];
  violations?: ViolationLogDto[];
  totalStudents?: number;
  activeStudents?: number;
  totalViolations?: number;
}

export interface GenericResponseV2<T> {
  status: ResponseStatusEnum;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProctoringService {
  private apiUrl = 'http://localhost:8080/api/v1/proctoring';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ============ Session Management ============

  /**
   * Gets all proctoring sessions
   */
  getAllSessions(): Observable<GenericResponseV2<ProctoringSessionDto[]>> {
    return this.http.get<GenericResponseV2<ProctoringSessionDto[]>>(
      `${this.apiUrl}/sessions`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Gets all sessions for a specific exam
   */
  getSessionsByExamId(examId: number): Observable<GenericResponseV2<ProctoringSessionDto[]>> {
    return this.http.get<GenericResponseV2<ProctoringSessionDto[]>>(
      `${this.apiUrl}/sessions/exam/${examId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Gets the active session for a specific exam (if exists)
   */
  getActiveSessionByExamId(examId: number): Observable<GenericResponseV2<ProctoringSessionDto>> {
    return this.http.get<GenericResponseV2<ProctoringSessionDto>>(
      `${this.apiUrl}/sessions/exam/${examId}/active`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Starts a new proctoring session for an exam
   */
  startProctoringSession(examId: number, proctorId: number): Observable<GenericResponseV2<ProctoringSessionDto>> {
    const params = new HttpParams()
      .set('examId', examId.toString())
      .set('proctorId', proctorId.toString());

    return this.http.post<GenericResponseV2<ProctoringSessionDto>>(
      `${this.apiUrl}/sessions/start`,
      null,
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * Ends an active proctoring session
   */
  endProctoringSession(sessionId: number): Observable<GenericResponseV2<ProctoringSessionDto>> {
    return this.http.put<GenericResponseV2<ProctoringSessionDto>>(
      `${this.apiUrl}/sessions/${sessionId}/end`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Pauses a proctoring session
   */
  pauseProctoringSession(sessionId: number): Observable<GenericResponseV2<ProctoringSessionDto>> {
    return this.http.put<GenericResponseV2<ProctoringSessionDto>>(
      `${this.apiUrl}/sessions/${sessionId}/pause`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Resumes a paused proctoring session
   */
  resumeProctoringSession(sessionId: number): Observable<GenericResponseV2<ProctoringSessionDto>> {
    return this.http.put<GenericResponseV2<ProctoringSessionDto>>(
      `${this.apiUrl}/sessions/${sessionId}/resume`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Gets the current status of a proctoring session
   */
  getSessionStatus(sessionId: number): Observable<GenericResponseV2<string>> {
    return this.http.get<GenericResponseV2<string>>(
      `${this.apiUrl}/sessions/${sessionId}/status`,
      { headers: this.getHeaders() }
    );
  }

  // ============ Video Monitoring ============

  /**
   * Gets the video stream URL for a session
   */
  getVideoStreamUrl(sessionId: number): Observable<GenericResponseV2<string>> {
    return this.http.get<GenericResponseV2<string>>(
      `${this.apiUrl}/sessions/${sessionId}/video-stream`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Updates the video stream URL for a session
   */
  updateVideoStream(sessionId: number, videoStreamUrl: string): Observable<GenericResponseV2<ProctoringSessionDto>> {
    const params = new HttpParams().set('videoStreamUrl', videoStreamUrl);

    return this.http.put<GenericResponseV2<ProctoringSessionDto>>(
      `${this.apiUrl}/sessions/${sessionId}/video-stream`,
      null,
      { headers: this.getHeaders(), params }
    );
  }

  // ============ Audio Monitoring ============

  /**
   * Starts audio monitoring for a session
   */
  startAudioMonitoring(sessionId: number): Observable<GenericResponseV2<string>> {
    return this.http.post<GenericResponseV2<string>>(
      `${this.apiUrl}/sessions/${sessionId}/audio/start`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Stops audio monitoring for a session
   */
  stopAudioMonitoring(sessionId: number): Observable<GenericResponseV2<string>> {
    return this.http.put<GenericResponseV2<string>>(
      `${this.apiUrl}/sessions/${sessionId}/audio/stop`,
      null,
      { headers: this.getHeaders() }
    );
  }

  // ============ Screen Monitoring ============

  /**
   * Starts screen monitoring for a session
   */
  startScreenMonitoring(sessionId: number): Observable<GenericResponseV2<string>> {
    return this.http.post<GenericResponseV2<string>>(
      `${this.apiUrl}/sessions/${sessionId}/screen/start`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Stops screen monitoring for a session
   */
  stopScreenMonitoring(sessionId: number): Observable<GenericResponseV2<string>> {
    return this.http.put<GenericResponseV2<string>>(
      `${this.apiUrl}/sessions/${sessionId}/screen/stop`,
      null,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Gets the active tabs for a session
   */
  getActiveTabs(sessionId: number): Observable<GenericResponseV2<string[]>> {
    return this.http.get<GenericResponseV2<string[]>>(
      `${this.apiUrl}/sessions/${sessionId}/tabs`,
      { headers: this.getHeaders() }
    );
  }

  // ============ Browser Policies ============

  /**
   * Enforces browser policies for a session
   */
  enforceBrowserPolicies(sessionId: number): Observable<GenericResponseV2<string>> {
    return this.http.put<GenericResponseV2<string>>(
      `${this.apiUrl}/sessions/${sessionId}/enforce-browser-policies`,
      null,
      { headers: this.getHeaders() }
    );
  }
}