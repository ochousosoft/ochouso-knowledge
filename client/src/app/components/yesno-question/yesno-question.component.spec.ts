import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YesnoQuestionComponent } from './yesno-question.component';

describe('YesnoQuestionComponent', () => {
  let component: YesnoQuestionComponent;
  let fixture: ComponentFixture<YesnoQuestionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YesnoQuestionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YesnoQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
