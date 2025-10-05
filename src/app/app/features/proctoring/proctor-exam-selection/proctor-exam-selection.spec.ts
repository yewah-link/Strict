import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProctorExamSelection } from './proctor-exam-selection';

describe('ProctorExamSelection', () => {
  let component: ProctorExamSelection;
  let fixture: ComponentFixture<ProctorExamSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProctorExamSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProctorExamSelection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
