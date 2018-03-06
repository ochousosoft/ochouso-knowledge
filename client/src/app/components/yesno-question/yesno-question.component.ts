import { Component, OnInit, Input, ViewChildren, QueryList, ElementRef } from '@angular/core';

@Component({
  selector: 'app-yesno-question',
  templateUrl: './yesno-question.component.html',
  styleUrls: ['./yesno-question.component.css']
})
export class YesnoQuestionComponent implements OnInit {
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

  setFocus(){
    this.currentAnswerIndex = 0;
    this.answerChecks.first.nativeElement.focus();
  }

  nextAnswer(){
    // debugger;
    if(this.currentAnswerIndex<this.answerChecks.length){
      this.currentAnswerIndex++;
      // this.answerChecks._results
      let answers = this.answerChecks.toArray();
      answers[this.currentAnswerIndex].nativeElement.focus();
    }
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
