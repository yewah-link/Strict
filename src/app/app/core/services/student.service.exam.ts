import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ========================
// Student Exam Models
// ========================

export enum ExamStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED'
}

export interface StudentExamDto {
  id?: number;
  sessionId?: string;
  studentId?: number;
  examId?: number;
  startedAt?: string;
  submittedAt?: string;
  status?: ExamStatus;
  answers?: StudentAnswerDto[];
  result?: ResultDto;
  violations?: ViolationLogDto[];
}

export interface StudentAnswerDto {
  questionId: number;
  selectedOptionId?: number;
  answerText?: string;
}

export interface ResultDto {
  totalMarks?: number;
  obtainedMarks?: number;
  percentage?: number;
}

export interface ViolationLogDto {
  timestamp: string;
  message: string;
}

export enum ResponseStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  FAILURE = 'FAILURE'
}

export interface GenericResponseV2<T> {
  status: ResponseStatusEnum;
  message: string;
  _embedded?: T;
}

// ========================
// Student Exam Service
// ========================

@Injectable({
  providedIn: 'root'
})
export class StudentExamService {
  private apiUrl = 'http://localhost:8080/api/v1/student-exams';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  startExam(examId: number, studentId: number): Observable<GenericResponseV2<StudentExamDto>> {
    return this.http.post<GenericResponseV2<StudentExamDto>>(
      `${this.apiUrl}/start/${examId}/student/${studentId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  submitExam(studentExamId: number, answers: StudentAnswerDto[]): Observable<GenericResponseV2<void>> {
    return this.http.post<GenericResponseV2<void>>(
      `${this.apiUrl}/submit/${studentExamId}`,
      answers,
      { headers: this.getHeaders() }
    );
  }

  autoSubmitExam(studentExamId: number): Observable<GenericResponseV2<void>> {
    return this.http.post<GenericResponseV2<void>>(
      `${this.apiUrl}/auto-submit/${studentExamId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getExamStatus(studentExamId: number): Observable<GenericResponseV2<string>> {
    return this.http.get<GenericResponseV2<string>>(
      `${this.apiUrl}/status/${studentExamId}`,
      { headers: this.getHeaders() }
    );
  }

  getStudentExam(studentExamId: number): Observable<GenericResponseV2<StudentExamDto>> {
    return this.http.get<GenericResponseV2<StudentExamDto>>(
      `${this.apiUrl}/${studentExamId}`,
      { headers: this.getHeaders() }
    );
  }

  getExamBySessionId(sessionId: string): Observable<GenericResponseV2<StudentExamDto>> {
    return this.http.get<GenericResponseV2<StudentExamDto>>(
      `${this.apiUrl}/link/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }
}
