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

  studentName?: string;
  studentEmail?: string;
  studentRegNo?: string;

  examTitle?: string;
  examSubject?: string;
  examTotalMarks?: number;
  examDuration?: number;

  questions?: QuestionDto[];

  // Existing fields
  startedAt?: string;
  submittedAt?: string;
  status?: ExamStatus;
  answers?: StudentAnswerDto[];
  result?: ResultDto;
  violations?: ViolationLogDto[];
}

export interface QuestionDto {
  id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'WRITTEN';
  marks: number;
  examId?: number | null;
  choices?: ChoicesDto[];
}

export interface ChoicesDto {
  id?: number;
  choiceText: string;
  isCorrect: boolean;
  questionId?: number | null;
}

export interface StudentAnswerDto {
  id?: number;
  studentExamId?: number;
  questionId: number;
  selectedChoiceId?: number;
  answerText?: string;
  isCorrect?: boolean;
  obtainedMarks?: number;
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
// =======================

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

  // ========================
  // Existing Endpoints
  // ========================

  startExam(examId: number, studentId: number): Observable<GenericResponseV2<StudentExamDto>> {
    return this.http.post<GenericResponseV2<StudentExamDto>>(
      `${this.apiUrl}/start?examId=${examId}&studentId=${studentId}`,
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
      `${this.apiUrl}/${studentExamId}/auto-submit`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getExamStatus(studentExamId: number): Observable<GenericResponseV2<string>> {
    return this.http.get<GenericResponseV2<string>>(
      `${this.apiUrl}/${studentExamId}/status`,
      { headers: this.getHeaders() }
    );
  }

  getStudentExam(studentExamId: number): Observable<GenericResponseV2<StudentExamDto>> {
    return this.http.get<GenericResponseV2<StudentExamDto>>(
      `${this.apiUrl}/${studentExamId}`,
      { headers: this.getHeaders() }
    );
  }

  getStudentExamByLink(examCode: string): Observable<GenericResponseV2<StudentExamDto>> {
    return this.http.get<GenericResponseV2<StudentExamDto>>(
      `${this.apiUrl}/link/${examCode}`,
      { headers: this.getHeaders() }
    );
  }

  getAllSubmittedExams(): Observable<GenericResponseV2<StudentExamDto[]>> {
    return this.http.get<GenericResponseV2<StudentExamDto[]>>(
      `${this.apiUrl}/submitted`,
      { headers: this.getHeaders() }
    );
  }

  // ========================
  // NEW Endpoints
  // ========================

  /**
   * Get all exams filtered by status (GRADED, SUBMITTED, IN_PROGRESS, etc.)
   * Example: getExamsByStatus('GRADED')
   * @param status The exam status to filter by
   */
  getExamsByStatus(status: string): Observable<GenericResponseV2<StudentExamDto[]>> {
    return this.http.get<GenericResponseV2<StudentExamDto[]>>(
      `${this.apiUrl}/by-status?status=${status}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all exams for a specific student
   * Example: getStudentExams(5)
   * @param studentId The ID of the student
   */
  getStudentExams(studentId: number): Observable<GenericResponseV2<StudentExamDto[]>> {
    return this.http.get<GenericResponseV2<StudentExamDto[]>>(
      `${this.apiUrl}/student/${studentId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all students who took a specific exam
   * Example: getStudentsByExam(8)
   * @param examId The ID of the exam
   */
  getStudentsByExam(examId: number): Observable<GenericResponseV2<StudentExamDto[]>> {
    return this.http.get<GenericResponseV2<StudentExamDto[]>>(
      `${this.apiUrl}/exam/${examId}/students`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all exams that are submitted but not yet graded (pending grading)
   * Useful for examiners to see which exams need grading
   */
  getPendingGradingExams(): Observable<GenericResponseV2<StudentExamDto[]>> {
    return this.http.get<GenericResponseV2<StudentExamDto[]>>(
      `${this.apiUrl}/pending-grading`,
      { headers: this.getHeaders() }
    );
  }
}