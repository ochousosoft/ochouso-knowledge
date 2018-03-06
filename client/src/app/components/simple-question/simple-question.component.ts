import { Component, OnInit, Input, ViewChildren, QueryList, ElementRef } from '@angular/core';

@Component({
  selector: 'app-simple-question',
  templateUrl: './simple-question.component.html',
  styleUrls: ['./simple-question.component.css']
})
export class SimpleQuestionComponent implements OnInit {
  @Input('question') question;
  @Input('index') index;
  @Input('currentIndex') currentIndex;
  @Input('survey') survey;
  @Input('numCols') numCols;

  @ViewChildren('answerChecks') answerChecks:QueryList<ElementRef>;

  currentAnswerIndex = 0;

  constructor() { }

  ngOnInit() {
    
  }

  setValue(value){
    // debugger;
    this.survey[this.question.field] = value;
    if(this.question.field == 'group_type'){
      if(this.survey['group_type'] 
        && (this.survey['group_type']== "1" || this.survey['group_type']== "2")){
        this.survey['group_number'] = this.survey['group_type'];
      }
      else{
        this.survey['group_number'] = null;
      }
    }
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
