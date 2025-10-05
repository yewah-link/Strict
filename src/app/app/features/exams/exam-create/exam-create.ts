import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ExamService, ExamDto, ResponseStatusEnum } from '../../../core/services/exam.service';

@Component({
  selector: 'app-exam-create',
  standalone: true,
  imports: [CommonModule, FormsModule],  
  templateUrl: './exam-create.html',
  styleUrl: './exam-create.scss'
})
export class ExamCreate implements OnInit {
  examData: ExamDto = {
    title: '',
    description: '',
    duration: 60,
    startTime: '',
    endTime: ''
  };

  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isEditMode = false;
  examId?: number;

  constructor(
    private examService: ExamService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.examId = +params['id'];
        this.loadExamData();
      }
    });
  }

  loadExamData() {
    if (!this.examId) return;

    this.isLoading = true;
    this.examService.getExamById(this.examId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.examData = response._embedded;
        } else {
          this.errorMessage = response.message || 'Failed to load exam';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load exam';
      }
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    const request = this.isEditMode && this.examId
      ? this.examService.updateExam(this.examId, this.examData)
      : this.examService.createExam(this.examData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS) {
          this.successMessage = this.isEditMode
            ? 'Exam updated successfully!'
            : 'Exam created successfully!';
          setTimeout(() => {
            this.router.navigate(['/exams']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to save exam';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to save exam';
      }
    });
  }

  onCancel() {
    this.router.navigate(['/exams']);
  }
}
