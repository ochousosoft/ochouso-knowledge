import { Component, OnInit, Input, ViewChildren, QueryList, ElementRef } from '@angular/core';

@Component({
  selector: 'app-satisfaction-question',
  templateUrl: './satisfaction-question.component.html',
  styleUrls: ['./satisfaction-question.component.css']
})
export class SatisfactionQuestionComponent implements OnInit {
  @Input('question') question;
  @Input('index') index;
  @Input('currentIndex') currentIndex;
  @Input('survey') survey;

  @ViewChildren('answerChecks') answerChecks:QueryList<ElementRef>;

  currentAnswerIndex = 0;

  constructor() { }

  ngOnInit() {

  }

  setValue(value){
    // debugger;
    this.survey[this.question.field] = value;
  }

  public setFocus(){
    this.currentAnswerIndex = 0;
    this.answerChecks.first.nativeElement.focus();
  }

  nextAnswer(){
    // debugger;
    this.currentAnswerIndex++;
    // this.answerChecks._results
    let answers = this.answerChecks.toArray();
    answers[this.currentAnswerIndex].nativeElement.focus();
  }

  previousAnswer(){
    // debugger;
    if(this.currentAnswerIndex>0){
      this.currentAnswerIndex--;
      // this.answerChecks._results
      let answers = this.answerChecks.toArray();
      answers[this.currentAnswerIndex].nativeElement.focus();
    }
  }

}
