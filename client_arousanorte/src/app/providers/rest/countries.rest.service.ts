import { Injectable } from '@angular/core';
import { RequestOptions, Headers, Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { Constants } from '../config/constants';

@Injectable()
export class CountriesService {

  constructor(private http: Http) { }

  public find(params){
    let headers = new Headers();
			//console.log(formData);
			headers.append('Content-Type', 'application/json');
			headers.append('Accept', 'application/json');
      let options = new RequestOptions({ headers: headers });

      let urlParams: any = [];
      let strParams = '';

      let where = "";
      if(params.where){
        urlParams.push('where=' + JSON.stringify(params.where));
      }

      if(params.order_by){
        urlParams.push('order_by=' + params.order_by);
      }

      if(params.projection){
        urlParams.push('projection=' + params.projection);
      }

      if(urlParams){
        strParams+="?";
        strParams+= urlParams.join('&');
      }

      
      return this.http.get(Constants.API_URL +  '/countries' + strParams, options)
      .map(res => res.json());
      //.catch(error => Observable.throw(error))
      //.subscribe(data => this.success(data), error => console.log(error));
  }

}
