import { Component, OnInit, Input, ViewChildren, QueryList, ElementRef } from '@angular/core';

@Component({
  selector: 'app-checkboxes-question',
  templateUrl: './checkboxes-question.component.html',
  styleUrls: ['./checkboxes-question.component.css']
})
export class CheckboxesQuestionComponent implements OnInit {
  @Input('question') question;
  @Input('index') index;
  @Input('currentIndex') currentIndex;
  @Input('survey') survey;

  @ViewChildren('answerChecks') answerChecks:QueryList<ElementRef>;

  currentAnswerIndex = 0;

  valueList = [];

  constructor() { }

  ngOnInit() {
    // debugger;
    
  }

  setValue(value){
    debugger;
    if(this.survey[this.question.field]){
      this.valueList = this.survey[this.question.field];
      let valueIndex = this.valueList.indexOf(value);
      if(valueIndex==-1){
        this.valueList.push(value);
      }
      else{
        this.valueList.splice(valueIndex, 1);
      }

      this.survey[this.question.field] = this.valueList;
    }
    else{
      this.survey[this.question.field] = [];
      this.valueList.push(value);
      this.survey[this.question.field] = this.valueList;
    }
  }

  setFocus(){
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

  isOptionChecked(answer){
    // debugger;
    if(this.valueList){
      return this.valueList.indexOf(answer.value)>=0;
    }
    return false;
  }

  ngAfterContentChecked(){
    // debugger;
    if(this.survey && this.survey[this.question.field]){
      this.valueList = this.survey[this.question.field];
    }
    else{
      this.valueList = [];
    }
  }

}
