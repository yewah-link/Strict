import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamCreate } from './exam-create';

describe('ExamCreate', () => {
  let component: ExamCreate;
  let fixture: ComponentFixture<ExamCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
