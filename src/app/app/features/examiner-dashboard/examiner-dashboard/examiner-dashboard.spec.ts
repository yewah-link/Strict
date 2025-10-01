import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExaminerDashboard } from './examiner-dashboard';

describe('ExaminerDashboard', () => {
  let component: ExaminerDashboard;
  let fixture: ComponentFixture<ExaminerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExaminerDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExaminerDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
