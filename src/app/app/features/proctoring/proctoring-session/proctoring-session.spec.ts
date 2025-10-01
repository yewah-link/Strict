import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProctoringSession } from './proctoring-session';

describe('ProctoringSession', () => {
  let component: ProctoringSession;
  let fixture: ComponentFixture<ProctoringSession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProctoringSession]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProctoringSession);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
