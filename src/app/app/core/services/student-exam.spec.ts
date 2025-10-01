import { TestBed } from '@angular/core/testing';

import { StudentExam } from './student-exam';

describe('StudentExam', () => {
  let service: StudentExam;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentExam);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
