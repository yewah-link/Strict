import { TestBed } from '@angular/core/testing';

import { StudentAnswer } from './student-answer';

describe('StudentAnswer', () => {
  let service: StudentAnswer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentAnswer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
