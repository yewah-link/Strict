import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-examiner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './examiner-dashboard.html',
  styleUrls: ['./examiner-dashboard.scss']
})
export class ExaminerDashboard {}
