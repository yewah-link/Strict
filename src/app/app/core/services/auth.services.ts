import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: RoleType;
  regNo?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export enum RoleType {
  EXAMINER = 'EXAMINER',
  STUDENT = 'STUDENT'
}

export interface UserDto {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: RoleType;
  regNo?: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export enum ResponseStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GenericResponseV2<T> {
  status: ResponseStatusEnum;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';
  private currentUserSubject: BehaviorSubject<UserDto | null>;
  public currentUser: Observable<UserDto | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<UserDto | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserDto | null {
    return this.currentUserSubject.value;
  }

  public getCurrentUserId(): number | null {
    const user = this.currentUserValue;
    return user?.id || null;
  }

  public getCurrentUser(): UserDto | null {
    return this.currentUserValue;
  }

  register(registerRequest: RegisterRequest): Observable<GenericResponseV2<UserDto>> {
    return this.http.post<GenericResponseV2<UserDto>>(
      `${this.apiUrl}/register`,
      registerRequest
    );
  }

  login(authRequest: AuthRequest): Observable<GenericResponseV2<AuthResponse>> {
    return this.http.post<GenericResponseV2<AuthResponse>>(
      `${this.apiUrl}/login`,
      authRequest
    ).pipe(
      tap(response => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          localStorage.setItem('token', response._embedded.token);
          localStorage.setItem('currentUser', JSON.stringify(response._embedded.user));
          this.currentUserSubject.next(response._embedded.user);
        }
      })
    );
  }

  refreshToken(): Observable<GenericResponseV2<AuthResponse>> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<GenericResponseV2<AuthResponse>>(
      `${this.apiUrl}/refresh`,
      {},
      { headers }
    ).pipe(
      tap(response => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          localStorage.setItem('token', response._embedded.token);
          localStorage.setItem('currentUser', JSON.stringify(response._embedded.user));
          this.currentUserSubject.next(response._embedded.user);
        }
      })
    );
  }

  logout(): Observable<GenericResponseV2<void>> {
    return this.http.post<GenericResponseV2<void>>(
      `${this.apiUrl}/logout`,
      {}
    ).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('regNo');
        this.currentUserSubject.next(null);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isExaminer(): boolean {
    const user = this.currentUserValue;
    return user?.role === RoleType.EXAMINER;
  }

  isStudent(): boolean {
    const user = this.currentUserValue;
    return user?.role === RoleType.STUDENT;
  }
}