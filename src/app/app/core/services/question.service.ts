import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Question Models
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

// Question Service
@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private apiUrl = 'http://localhost:8080/api/v1/exam';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  addQuestion(examId: number, questionDto: QuestionDto): Observable<GenericResponseV2<QuestionDto>> {
    return this.http.post<GenericResponseV2<QuestionDto>>(
      `${this.apiUrl}/${examId}/questions`,
      questionDto,
      { headers: this.getHeaders() }
    );
  }

  getQuestionsByExam(examId: number): Observable<GenericResponseV2<QuestionDto[]>> {
    return this.http.get<GenericResponseV2<QuestionDto[]>>(
      `${this.apiUrl}/${examId}/questions`,
      { headers: this.getHeaders() }
    );
  }

  getQuestionById(id: number): Observable<GenericResponseV2<QuestionDto>> {
    return this.http.get<GenericResponseV2<QuestionDto>>(
      `${this.apiUrl}/questions/${id}`,
      { headers: this.getHeaders() }
    );
  }

  updateQuestion(id: number, questionDto: QuestionDto): Observable<GenericResponseV2<QuestionDto>> {
    return this.http.put<GenericResponseV2<QuestionDto>>(
      `${this.apiUrl}/questions/${id}`,
      questionDto,
      { headers: this.getHeaders() }
    );
  }

  deleteQuestion(id: number): Observable<GenericResponseV2<void>> {
    return this.http.delete<GenericResponseV2<void>>(
      `${this.apiUrl}/question/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
