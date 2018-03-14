import { Component, OnInit, Input, ViewChildren, QueryList, ElementRef } from '@angular/core';

@Component({
  selector: 'app-numeric-multiple-question',
  templateUrl: './numeric-multiple-question.component.html',
  styleUrls: ['./numeric-multiple-question.component.css']
})
export class NumericMultipleQuestionComponent implements OnInit {
  @Input('question') question;
  @Input('index') index;
  @Input('currentIndex') currentIndex;
  @Input('survey') survey;

  @ViewChildren('answerChecks') answerChecks:QueryList<ElementRef>;

  currentAnswerIndex = 0;

  values = {};

  constructor() { }

  ngOnInit() {
    // debugger;
    debugger
    
  }

  setValue(){
    
  }

  setFocus(){
    this.currentAnswerIndex = 0;
    this.answerChecks.first.nativeElement.focus();
  }

   nextAnswer(){
    debugger;
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
  
  onValueChange(event, answer){
    debugger
    let value = event.currentTarget.value;
    this.values[answer.value.toString()] = value;
    this.survey[this.question.field] = this.values;
    // debugger;
  }

  ngAfterContentChecked(){
    // debugger;
    if(this.survey && this.survey[this.question.field]){
      this.values = this.survey[this.question.field];
    }
    else{
      this.values = {};
    }
  }


}
