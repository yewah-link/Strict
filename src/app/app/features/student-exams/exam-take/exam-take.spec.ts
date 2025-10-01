import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamTake } from './exam-take';

describe('ExamTake', () => {
  let component: ExamTake;
  let fixture: ComponentFixture<ExamTake>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamTake]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamTake);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
