import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamStatus } from './exam-status';

describe('ExamStatus', () => {
  let component: ExamStatus;
  let fixture: ComponentFixture<ExamStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
