import { Component, OnInit, ViewChild, Input } from '@angular/core';

@Component({
  selector: 'app-numeric-question',
  templateUrl: './numeric-question.component.html',
  styleUrls: ['./numeric-question.component.css']
})
export class NumericQuestionComponent implements OnInit {
  @ViewChild('txtNumber') txtNumber;

  @Input('question') question;
  @Input('index') index;
  @Input('currentIndex') currentIndex;
  @Input('survey') survey;
  
  constructor() { }

  ngOnInit() {

  }

  setFocus(){
    // debugger;
    this.txtNumber.nativeElement.focus();
  }

}
