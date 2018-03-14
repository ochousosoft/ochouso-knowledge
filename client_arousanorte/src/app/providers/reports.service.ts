import { Injectable } from '@angular/core';
import { SurveysService } from './rest/surveys.rest.service';
import { Constants } from './config/constants';
import { MastersService } from './masters.service';

@Injectable()
export class ReportsService {
  surveys:any[];
  report: any;
  constructor(
    private surveysSrv: SurveysService,
    private masters: MastersService
  ) {
    //this.loadData(null, null, null);
  }

  loadData(municipality, initDate, endDate, groupTypes, ages, accommodations){
    return new Promise ((resolve,reject) => {
        // this.isRequesting = true;
        let params:any = {where: {}, projection: 'complete'};
        if(municipality){
          params.where.municipality_id = municipality;
        }
        params.where.initDate = initDate;
        params.where.endDate = endDate;
        params.where.groupTypes = groupTypes;
        params.where.ages = ages;
        params.where.accommodations = accommodations;
        //debugger
        this.surveysSrv.filter(params)
        .subscribe(data => {
          ////debugger
          // this.isRequesting = false;
          this.surveys = data.result.data;

          resolve();
        }, error => {
          // this.isRequesting = false;
          console.log(error);

          reject(error);
        });
    });

  }

  initialize(){
    this.report = {num_surveys: (this.surveys?this.surveys.length:0)};
    // for(let i = 0; i< Constants.QUESTIONS.length; i++){
    //   let question = Constants.QUESTIONS[i];
    //   switch(question.field){
    //     case 'group_type':
    //     this.report[question.field] = [0,0,0,0];
    //     break;
    //     case 'lang':
    //     this.report[question.field] = [0,0,0];
    //     break;
    //     case 'transport':
    //     case 'consult_reason':
    //     case 'overnight_accommodation':
    //     case 'travel_reason':
    //       this.report[question.field] = {};
    //       for(let j = 0; j< question['answers'].length; j++){
    //         this.report[question.field][question['answers'][j].text['gl']] = 0;
    //       }
    //     break;
    //   }
    // }
  }


  getReports(municipality, initDate, endDate, groupTypes, ages, accommodations){
    return new Promise ((resolve,reject) => {
      ////debugger
      // this.loadData(municipality, initDate, endDate, groupTypes, ages, accommodations).then(()=>{
      //   this.initialize();
      //   ////debugger
      //   if(this.surveys){
      //     let items = ['transport', 'consult_reason', 'overnight_accommodation', 'travel_reason'];
      //     let index = [13, 12, 11, 9];

      //     this.report['group_type'] = [0, 0, 0, 0];
      //     this.report['age'] = [0, 0, 0, 0, 0, 0, 0, 0];
      //     this.report['duration'] = [0, 0, 0, 0, 0, 0];

      //     for(let i = 0; i<this.surveys.length;i++){
      //       for(let j = 0; j< items.length; j++){
      //         let column = this.surveys[i][items[j]];
      //         if(column){
      //           let answers = Constants.QUESTIONS[index[j]]['answers'];
      //           for(let k = 0; k< answers.length; k++){
      //             if(column.indexOf(answers[k].value)>=0){
      //               this.report[items[j]][answers[k].text['gl']]++;
      //             }
      //           }
      //         }
      //       }

      //       if(this.surveys[i]['age']){
      //         let ages = this.surveys[i]['age'];
      //         let ageKeys = Object.keys(this.surveys[i]['age']);
      //         for(let h = 0; h < ageKeys.length; h++){
      //           if(!isNaN(parseInt(ages[ageKeys[h]]))){
      //             this.report['age'][parseInt(ageKeys[h])] += parseInt(ages[ageKeys[h]]);
      //           }
                
      //         }
      //       }
      //       //debugger
      //       this.report['group_type'][this.surveys[i]['group_type']-1]++;
      //       let langs = {'gl':0, 'es':1, 'en': 2};
      //       this.report['lang'][langs[this.surveys[i]['lang']]]++;

      //       ////debugger
      //       if(this.surveys[i]['duration']){
      //         if(this.surveys[i]['duration']==0){
      //           this.report['duration'][0]++;
      //         }
      //         else if(this.surveys[i]['duration']>0 && this.surveys[i]['duration']<=2){
      //           this.report['duration'][1]++;
      //         }
      //         else if(this.surveys[i]['duration']>2 && this.surveys[i]['duration']<=7){
      //           this.report['duration'][2]++;
      //         }
      //         else if(this.surveys[i]['duration']>7 && this.surveys[i]['duration']<=15){
      //           this.report['duration'][3]++;
      //         }
      //         else if(this.surveys[i]['duration']>15 && this.surveys[i]['duration']<=30){
      //           this.report['duration'][4]++;
      //         }
      //         else if(this.surveys[i]['duration']>30){
      //           this.report['duration'][5]++;
      //         }
      //       }

      //     }
      //   }

      //   resolve(this.report);
      // });

    });
  }

  getSurveys(){
    let result = [];
    //headers
    // let title = ['Listado enquisas'];
    // result.push(title);
    
    // let header = ['ID'];
    // for(let i = 0; i<Constants.QUESTIONS.length; i++){
    //   header.push(Constants.QUESTIONS[i].question['gl']);
    // }
    // result.push(header);

    // for(let i = 0; i< this.surveys.length; i++){
    //   let row = [this.surveys[i].id];
    //   for(let j = 0; j<Constants.QUESTIONS.length; j++){
    //     let value = '';
    //     switch(Constants.QUESTIONS[j].template){
    //       case 'simple':
    //       case 'yes_no':
    //         for(let k = 0; k<Constants.QUESTIONS[j]['answers'].length; k++){
    //           if(Constants.QUESTIONS[j]['answers'][k].value == this.surveys[i][Constants.QUESTIONS[j].field]){
    //             //debugger
    //             value = Constants.QUESTIONS[j]['answers'][k].text['gl'];
    //             break;
    //           }
    //         }

    //       break;
    //       case 'numeric-multiple':
    //         // debugger
    //         let values2 = [];
    //         let item = this.surveys[i][Constants.QUESTIONS[j].field];
    //         if(item){
    //           if(typeof item == 'string'){
    //             item = JSON.parse(item);
    //           }
    //           let itemKeys = Object.keys(item);
    //           for(let k = 0; k < itemKeys.length; k++){
    //             for(let l = 0; l<Constants.QUESTIONS[j]['answers'].length; l++){
    //               if(Constants.QUESTIONS[j]['answers'][l].value == itemKeys[k]){
    //                 values2.push(Constants.QUESTIONS[j]['answers'][l].text + ': ' + item[itemKeys[k]]);
    //               }
    //             }
    //           }
    //         }
    //         value = values2.join(', ');
    //       break;
    //       case 'OrigenPage':
    //         value = this.masters.getCountryName(this.surveys[i][Constants.QUESTIONS[j].field]);
    //       break;
    //       case 'checkboxes':
    //         let values = [];
    //         for(let k = 0; k<Constants.QUESTIONS[j]['answers'].length; k++){
    //           if(this.surveys[i][Constants.QUESTIONS[j].field].indexOf(Constants.QUESTIONS[j]['answers'][k].value)>0){
    //             values.push(Constants.QUESTIONS[j]['answers'][k].text['gl']);
    //           }
    //         }

    //         value = values.join(', ');
    //       break;
    //       default:
    //         value = this.surveys[i][Constants.QUESTIONS[j].field];
    //       break;
    //     }

    //     row.push(value);
    //   }

    //   result.push(row);
    // }

    return result;
  }

}
