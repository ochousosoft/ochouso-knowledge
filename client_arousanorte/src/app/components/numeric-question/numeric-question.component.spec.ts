import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumericQuestionComponent } from './numeric-question.component';

describe('NumericQuestionComponent', () => {
  let component: NumericQuestionComponent;
  let fixture: ComponentFixture<NumericQuestionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NumericQuestionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumericQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
