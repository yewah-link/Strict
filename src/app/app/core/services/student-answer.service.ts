import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Models & Enums
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

export interface StudentAnswerDto {
   id?: number;
  studentExamId: number;
  questionId: number;
  selectedChoiceId?: number;  // ✅ For multiple choice questions
  answerText?: string;        // ✅ For text-based questions
  isCorrect?: boolean;
  obtainedMarks?: number
}

@Injectable({
  providedIn: 'root'
})
export class StudentAnswerService {
  private apiUrl = `http://localhost:8080/api/v1/student-answers`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  submitAnswer(studentAnswerDto: StudentAnswerDto): Observable<GenericResponseV2<StudentAnswerDto>> {
    return this.http.post<GenericResponseV2<StudentAnswerDto>>(
      this.apiUrl,
      studentAnswerDto,
      { headers: this.getHeaders() }
    );
  }

  getAnswersByStudentExam(studentExamId: number): Observable<GenericResponseV2<StudentAnswerDto[]>> {
    return this.http.get<GenericResponseV2<StudentAnswerDto[]>>(
      `${this.apiUrl}/student-exam/${studentExamId}`,
      { headers: this.getHeaders() }
    );
  }

  getAnswerById(id: number): Observable<GenericResponseV2<StudentAnswerDto>> {
    return this.http.get<GenericResponseV2<StudentAnswerDto>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  updateAnswer(id: number, studentAnswerDto: StudentAnswerDto): Observable<GenericResponseV2<StudentAnswerDto>> {
    return this.http.put<GenericResponseV2<StudentAnswerDto>>(
      `${this.apiUrl}/${id}`,
      studentAnswerDto,
      { headers: this.getHeaders() }
    );
  }

  deleteAnswer(id: number): Observable<GenericResponseV2<void>> {
    return this.http.delete<GenericResponseV2<void>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  gradeAnswers(studentExamId: number): Observable<GenericResponseV2<StudentAnswerDto[]>> {
    return this.http.post<GenericResponseV2<StudentAnswerDto[]>>(
      `${this.apiUrl}/grade/${studentExamId}`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
