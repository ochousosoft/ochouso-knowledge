import { Component, OnInit, HostListener, ViewChild, ViewChildren, QueryList, ElementRef, ViewContainerRef } from '@angular/core';
import { ScrollToService } from 'ng2-scroll-to-el';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from  '../../providers/config/constants';
import { SurveysService } from '../../providers/rest/surveys.rest.service';
import { SurveyMem } from '../../providers/memory/survey.memory';
import * as moment from 'moment';

@Component({
  selector: 'app-survey-detail',
  templateUrl: './survey-detail.component.html',
  styleUrls: ['./survey-detail.component.css']
})
export class SurveyDetailComponent implements OnInit {
  @ViewChildren('question') questionControls:QueryList<ElementRef>;
  @ViewChildren('questionMark') questionMark:QueryList<ElementRef>;
  @ViewChild('bottomMark') bottomMark;
  @ViewChild('bottomMarkSatisfaction') bottomMarkSatisfaction;
  @ViewChild('topMark') topMark;

  @ViewChildren('satisfactionQestion') satisfactionQuestionControls:QueryList<ElementRef>;
  @ViewChildren('satisfactionQuestionMark') satisfactionQuestionMark:QueryList<ElementRef>;
  @ViewChild('satisfactionBottomMark') satisfactionBottomMark;

  @ViewChild('btnSaveSurvey') btnSaveSurvey;
  @ViewChild('btnSaveSatisfaction') btnSaveSatisfaction;
  @ViewChild('btnBackSurvey') btnBackSurvey;
  @ViewChild('btnBackSatisfaction') btnbtnBackSatisfactionBack;

  // questions = Constants.QUESTIONS;
  // satisfactionQuestions = Constants.SATISFACTION_CHEK;
  currentIndex = 0;
  key;
  sub: any;
  id: number;
  survey: any;
  selectedTab: number = 0;
  surveyErrors = '';

  survey_type = '';
  do_satisfaction = false;

  constructor(
    private surveyMem: SurveyMem,
    private surveysSrv: SurveysService,
    private route: ActivatedRoute,
    private router: Router,
    private scrollService: ScrollToService,
    private toastsManager: ToastsManager
  )
  {

  }

   // @HostListener('document:keypress', ['$event']) no reconoce flechas <-, ->, etc...
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handleQuestionTransitions(event.key);  
  }

  handleQuestionTransitions(transition){
    // let questionControls = this.questionControls;
    // let questionMark = this.questionMark;
    // let questions:any = this.questions;
    // if(this.selectedTab==1){
    //   questionControls = this.satisfactionQuestionControls;
    //   questionMark = this.satisfactionQuestionMark;
    //   questions = this.satisfactionQuestions;
    // }


    // if(transition == 'Enter' || transition == 'ArrowDown'){
    //   if(event){
    //     event.returnValue = false; 
    //   }

    //   let step = 1;
    //   if(this.currentIndex>=0){
    //     if(questions[this.currentIndex].field == 'origin'){
    //       if(this.survey['origin'] && this.survey['origin']!=140){
    //         step = 2;
    //       }
    //     }
    //     else if(questions[this.currentIndex].field == 'group_type'){
    //       if(this.survey['group_type'] 
    //         && (this.survey['group_type']== 1 || this.survey['group_type']== 2)){
    //         step = 2;
    //       }
    //     }
    //     else if(questions[this.currentIndex].field == 'overnights'){
    //       if(this.survey['overnights'] 
    //         && (this.survey['overnights']== 2)){
    //         this.survey['overnight_accommodation'] = "[]";
    //         step = 2;
    //       }
    //     }
    //   }
      
    //   if(this.currentIndex + step <questions.length){
    //     this.currentIndex += step;

    //     questionControls.toArray()[this.currentIndex]['setFocus']();
    //     //Bajar a la siguiente pregunta
    //     this.scrollService.scrollTo(questionMark.toArray()[this.currentIndex].nativeElement);
    //   }
    //   else{
    //     if(this.selectedTab == 0){
    //       this.btnSaveSurvey.nativeElement.focus();
    //       this.scrollService.scrollTo(this.bottomMark.nativeElement);

    //     }
    //     else{
    //       this.btnSaveSatisfaction.nativeElement.focus();
    //       this.scrollService.scrollTo(this.bottomMarkSatisfaction.nativeElement);
    //     } 
    //   }
      
    // }
    // else if(transition == 'ArrowUp'){
    //   event.returnValue = false; 
    //   debugger
    //   if(this.currentIndex > 0){
    //     this.currentIndex = this.currentIndex - 1;
    //   }

    //   questionControls.toArray()[this.currentIndex]['setFocus']();
    //   //Subir a la pregunta anterior
    //   this.scrollService.scrollTo(questionMark.toArray()[this.currentIndex].nativeElement);

    // }  
    // else if(transition == 'ArrowRight'){ 
    //   event.returnValue = false; 
    //   questionControls.toArray()[this.currentIndex]['nextAnswer']();
    // }
    // else if(transition == 'ArrowLeft'){
    //   event.returnValue = false; 
    //   questionControls.toArray()[this.currentIndex]['previousAnswer']();
    // }
  }

  // checkQuestionVisible(field){
  //   switch(field){
  //     case 'postal_code':
  //       return this.survey['origin'] && this.survey['origin'] == 140;
  //     default:
  //     return true;
  //   }
  // }



  selectTab(index){
    this.selectedTab = index;
    this.currentIndex = -1;
    setTimeout(()=>{
      this.handleQuestionTransitions('Enter');
    },250);
    
  }

  loadSurvey(id: number){
    
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
        this.survey_type = params['survey_type']; 
        // debugger;
        this.sub = this.route.params.subscribe(params => {
          this.id = +params['id']; 
          if(params['id']){
            this.surveysSrv.find({where: {id:this.id}, projection: 'complete'})
            .subscribe(data => {
              debugger;
              this.survey = data.result.data[0];
              if(this.survey.age && typeof this.survey.age == "string"){
                this.survey.age = JSON.parse(this.survey.age);
              }
              
            }, error => console.log(error));
          }
          else{
          this.survey = {};
          }

        });
    });
    
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  initialized = false;
  ngAfterViewChecked() {
    if(!this.initialized && this.questionControls.toArray()[0]){
      this.questionControls.toArray()[0]['setFocus']();
      this.initialized = true;
    }
  }

  saveSurvey(_continue: boolean, questions){
    debugger
    if(this.isValidSurvey(questions)){
      this.survey.survey_date = moment().format('DD/MM/YYYY HH:mm:ss')
      this.survey.age = JSON.stringify(this.survey.age);
      this.survey.travel_reason = JSON.stringify(this.survey.travel_reason);
      this.survey.overnight_accommodation = JSON.stringify(this.survey.overnight_accommodation);
      this.survey.consult_reason = JSON.stringify(this.survey.consult_reason);
      this.survey.transport = JSON.stringify(this.survey.transport);
      

      this.surveysSrv.save({data: this.survey})
        .subscribe(data => {
          // debugger;
          this.survey = data.result;
          this.toastsManager.success('Enquisa gardada correctamente', 'Gardado');
          
          // this.toastsManager.warning('You are being warned.', 'Alert!');
          // this.toastsManager.info('Just some information for you.');
          
          if(this.selectedTab==0 && _continue){
            this.selectTab(1);
            this.do_satisfaction = true;
          }
          else{
            this.router.navigate(['/surveys', this.survey_type]);
          }
        }, error => {
          this.toastsManager.error('Erro ó gardar enquisa', 'Erro de gardado');
          console.log(error)
        });
    }
    else{

    }
  }

  isValidSurvey(questions){
    debugger
    this.surveyErrors = '';
    let result = true;
    for(let i = 0; i<questions.length; i++){
      if(questions[i].field == 'overnight_accommodation' && this.survey['overnights'] == "2") {
        //si no pernocta no se valida el alojamiento
      }
      else{
        let value = this.survey[questions[i].field];
        if(!value || value == '{}' || value == '[]'){
          this.surveyErrors+='<b>'+(i+1)+') '+questions[i].question['gl'] + '</b><br>';
          result = false;
        }
      }
      
    }

    if(this.surveyErrors){
      this.surveyErrors = 'Campos sen cubrir:<br>' + this.surveyErrors;
    }

    return result;
  }

}
