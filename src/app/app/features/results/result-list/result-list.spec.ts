import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultList } from './result-list';

describe('ResultList', () => {
  let component: ResultList;
  let fixture: ComponentFixture<ResultList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
