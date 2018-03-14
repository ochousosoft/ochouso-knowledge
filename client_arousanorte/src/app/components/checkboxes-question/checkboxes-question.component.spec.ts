import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckboxesQuestionComponent } from './checkboxes-question.component';

describe('CheckboxesQuestionComponent', () => {
  let component: CheckboxesQuestionComponent;
  let fixture: ComponentFixture<CheckboxesQuestionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckboxesQuestionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckboxesQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
