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

export interface ResultDto {
  id?: number;
  studentExamId: number;
  totalMarks: number;
  obtainedMarks: number;
  graded: boolean;
}

export interface ExamStatistics {
  examId?: number;
  examTitle?: string;
  totalStudents?: number;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  passRate?: number;
  gradeDistribution?: Map<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private apiUrl = `http://localhost:8080/api/v1/results`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  calculateResult(studentExamId: number): Observable<GenericResponseV2<ResultDto>> {
    return this.http.post<GenericResponseV2<ResultDto>>(
      `${this.apiUrl}/calculate/${studentExamId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getResultById(id: number): Observable<GenericResponseV2<ResultDto>> {
    return this.http.get<GenericResponseV2<ResultDto>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getResultsByStudent(studentId: number): Observable<GenericResponseV2<ResultDto[]>> {
    return this.http.get<GenericResponseV2<ResultDto[]>>(
      `${this.apiUrl}/student/${studentId}`,
      { headers: this.getHeaders() }
    );
  }

  getResultsByExam(examId: number): Observable<GenericResponseV2<ResultDto[]>> {
    return this.http.get<GenericResponseV2<ResultDto[]>>(
      `${this.apiUrl}/exam/${examId}`,
      { headers: this.getHeaders() }
    );
  }

  getResultByStudentExam(studentExamId: number): Observable<GenericResponseV2<ResultDto>> {
    return this.http.get<GenericResponseV2<ResultDto>>(
      `${this.apiUrl}/student-exam/${studentExamId}`,
      { headers: this.getHeaders() }
    );
  }

  updateResult(id: number, resultDto: ResultDto): Observable<GenericResponseV2<ResultDto>> {
    return this.http.put<GenericResponseV2<ResultDto>>(
      `${this.apiUrl}/${id}`,
      resultDto,
      { headers: this.getHeaders() }
    );
  }

  deleteResult(id: number): Observable<GenericResponseV2<void>> {
    return this.http.delete<GenericResponseV2<void>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  publishResult(resultId: number): Observable<GenericResponseV2<ResultDto>> {
    return this.http.post<GenericResponseV2<ResultDto>>(
      `${this.apiUrl}/publish/${resultId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  unpublishResult(resultId: number): Observable<GenericResponseV2<ResultDto>> {
    return this.http.post<GenericResponseV2<ResultDto>>(
      `${this.apiUrl}/unpublish/${resultId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getExamStatistics(examId: number): Observable<GenericResponseV2<ExamStatistics>> {
    return this.http.get<GenericResponseV2<ExamStatistics>>(
      `${this.apiUrl}/statistics/exam/${examId}`,
      { headers: this.getHeaders() }
    );
  }

  markAllStudentsForExam(examId: number): Observable<GenericResponseV2<ResultDto[]>> {
  return this.http.post<GenericResponseV2<ResultDto[]>>(
    `${this.apiUrl}/mark-all/exam/${examId}`,
    {},
    { headers: this.getHeaders() }
  );
}

markAndPublishExam(studentExamId: number, autoPublish: boolean = false): Observable<GenericResponseV2<ResultDto>> {
  return this.http.post<GenericResponseV2<ResultDto>>(
    `${this.apiUrl}/mark-and-publish/${studentExamId}?autoPublish=${autoPublish}`,
    {},
    { headers: this.getHeaders() }
  );
}

submitGrade(studentExamId: number, score: number) {
  return this.http.post<GenericResponseV2<ResultDto>>(
    `${this.apiUrl}/submit-grade/${studentExamId}?score=${score}`,
    {},
    { headers: this.getHeaders() }
  );
}

}
