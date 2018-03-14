import { Component, OnInit,  } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { FilterMem } from '../../providers/memory/filter.memory';
import { SurveysService } from '../../providers/rest/surveys.rest.service';
import { AuthenticationService } from '../../providers/index';

@Component({
  selector: 'app-surveys',
  templateUrl: './surveys.component.html',
  styleUrls: ['./surveys.component.css']
})
export class SurveysComponent implements OnInit {
  surveys:any[];
  isRequesting = false;
  municipalities = [
    {id:1, name: 'Rianxo'}, {id:2, name: 'Boiro'}, {id:3, name: 'Riveira'}, {id:4, name: 'A Pobra'}, {id:6, name: 'AVA test'}
  ];
  filter:any = {};
  Auth;

  survey_type = '';

  constructor(
    private surveysSrv: SurveysService,
    private router: Router,
    private filterMem: FilterMem,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute) {
      this.Auth = this.authenticationService;

    }

  loadSurveys(){
    this.isRequesting = true;
    let params:any = {where: {}, projection: 'complete'};
    switch(this.survey_type){
      case 'survey':
        params.projection = 'current_surveys';
      break;
      case 'satisfaction':
        params.projection = 'satisfaction_surveys';
      break;
    }
    if(this.filter.municipality){
      params.where.municipality_id = this.filter.municipality;
    }
    if(this.filter.source){
      params.where.source = this.filter.source;
    }
    params.order_by = {'formatted_survey_date':'DESC'};
    // debugger
    this.surveysSrv.find(params)
      .subscribe(data => {
        this.isRequesting = false;
        this.surveys = data.result.data;
      }, error => {
        this.isRequesting = false;
        console.log(error)
      });
  }

  ngOnInit() {
    if(this.authenticationService.isAuthorized('technician')){
      let session = this.authenticationService.getSession();
      this.filter.municipality = session.data.municipality_id;
      this.filterMem.set(this.filter);
    }

    this.filter = this.filterMem.get();
    // debugger
    this.route.params.subscribe(params => {
       this.survey_type = params['survey_type'];
       this.loadSurveys();
    });


  }

  onMunicipalityChange(){
    this.filterMem.setValue('municipality', this.filter.municipality);
    this.loadSurveys();
  }

  onSourceChange($event){
    this.filterMem.setValue('source', this.filter.source);
    this.loadSurveys();
  }

  onTypeChange($event){
    this.filterMem.setValue('type', this.filter.type);
    this.loadSurveys();
  }

}
