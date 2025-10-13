import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionManagement } from './submission-management';

describe('SubmissionManagement', () => {
  let component: SubmissionManagement;
  let fixture: ComponentFixture<SubmissionManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmissionManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
