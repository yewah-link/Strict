import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamDetail } from './exam-detail';

describe('ExamDetail', () => {
  let component: ExamDetail;
  let fixture: ComponentFixture<ExamDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
