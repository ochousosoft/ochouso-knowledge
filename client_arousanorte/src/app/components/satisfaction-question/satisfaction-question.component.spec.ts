import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SatisfactionQuestionComponent } from './satisfaction-question.component';

describe('SatisfactionQuestionComponent', () => {
  let component: SatisfactionQuestionComponent;
  let fixture: ComponentFixture<SatisfactionQuestionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SatisfactionQuestionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SatisfactionQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
