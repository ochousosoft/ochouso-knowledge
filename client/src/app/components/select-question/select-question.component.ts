import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MastersService } from '../../providers/masters.service';

@Component({
  selector: 'app-select-question',
  templateUrl: './select-question.component.html',
  styleUrls: ['./select-question.component.css']
})
export class SelectQuestionComponent implements OnInit {
  @ViewChild('txtNumber') txtNumber;

  @Input('question') question;
  @Input('index') index;
  @Input('currentIndex') currentIndex;
  @Input('survey') survey;
  options:any;

  constructor(
    private mastersService: MastersService
  ) { }

  ngOnInit() {
    this.options = this.mastersService.getCountries();
  }

  setFocus(){
    this.txtNumber.nativeElement.focus();
  }

  onSelectChange(){
    if(this.question.field == 'origin'){
      if(this.survey['origin'] && this.survey['origin']!=140){
        this.survey['postal_code'] = '---';
      }
    }
  }

  public initValues(options){
    this.options = options;
  }

}
