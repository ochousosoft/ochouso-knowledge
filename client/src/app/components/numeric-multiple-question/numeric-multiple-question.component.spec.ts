import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumericMultipleQuestionComponent } from './numeric-multiple-question.component';

describe('NumericMultipleQuestionComponent', () => {
  let component: NumericMultipleQuestionComponent;
  let fixture: ComponentFixture<NumericMultipleQuestionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NumericMultipleQuestionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumericMultipleQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
