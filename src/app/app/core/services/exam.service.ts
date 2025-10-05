import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Exam Models
export interface ExamDto {
  id?: number;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  createdDate?: string;
  duration: number;
  instructions?: string;
  examCode?: string;
  examLink?: string;
  questions?: QuestionDto[];
}

export interface QuestionDto {
  id?: number;
  text: string;
  type: string;
  marks?: number;
  examId?: number;
  choices?: ChoicesDto[];
}

export interface ChoicesDto {
  id?: number;
  choiceText: string;
  isCorrect: boolean;
  questionId?: number;
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

// Exam Service
@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'http://localhost:8080/api/v1/exam';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  createExam(examDto: ExamDto): Observable<GenericResponseV2<ExamDto>> {
    return this.http.post<GenericResponseV2<ExamDto>>(
      this.apiUrl,
      examDto,
      { headers: this.getHeaders() }
    );
  }

  getExamById(id: number): Observable<GenericResponseV2<ExamDto>> {
    return this.http.get<GenericResponseV2<ExamDto>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Fixed: Changed from /code/ to /link/ to match backend
  getExamByCode(examCode: string): Observable<GenericResponseV2<ExamDto>> {
    return this.http.get<GenericResponseV2<ExamDto>>(
      `${this.apiUrl}/link/${examCode}`,
      { headers: this.getHeaders() }
    );
  }

  updateExam(id: number, examDto: ExamDto): Observable<GenericResponseV2<ExamDto>> {
    return this.http.put<GenericResponseV2<ExamDto>>(
      `${this.apiUrl}/${id}`,
      examDto,
      { headers: this.getHeaders() }
    );
  }

  deleteExam(id: number): Observable<GenericResponseV2<void>> {
    return this.http.delete<GenericResponseV2<void>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getAllExams(): Observable<GenericResponseV2<ExamDto[]>> {
    return this.http.get<GenericResponseV2<ExamDto[]>>(
      this.apiUrl,
      { headers: this.getHeaders() }
    );
  }
}