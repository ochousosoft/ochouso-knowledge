import { Injectable } from '@angular/core';

@Injectable()
export class SurveyMem {

  private survey: any;

  constructor() {

  }

  public set(survey : any) {
    this.survey = survey;
  }

  public get() :  any {
    return this.survey;
  }

}
