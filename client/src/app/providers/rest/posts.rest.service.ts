import { Injectable } from '@angular/core';
import { RequestOptions, Headers, Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { SessionUserMem } from '../memory/session-user.memory';

import { Constants } from '../config/constants';

@Injectable()
export class PostsRestService {
  User
  constructor(
    private http: Http,
    private sessionUser: SessionUserMem
  ) { }

  public filter(params){
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

      if(params.projection){
        urlParams.push('projection=' + params.projection);
      }

      if(params.order_by){
        urlParams.push('order_by=' + JSON.stringify(params.order_by));
      }

      if(urlParams){
        strParams+="?";
        strParams+= urlParams.join('&');
      }


      return this.http.get(Constants.API_URL +  '/posts' + strParams, options)
      .map(res => res.json());
      //.catch(error => Observable.throw(error))
      //.subscribe(data => this.success(data), error => console.log(error));
  }

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

      if(params.projection){
        urlParams.push('projection=' + params.projection);
      }

      if(params.order_by){
        urlParams.push('order_by=' + JSON.stringify(params.order_by));
      }

      if(urlParams){
        strParams+="?";
        strParams+= urlParams.join('&');
      }


      return this.http.get(Constants.API_URL +  '/posts' + strParams, options)
      .map(res => res.json());
      //.catch(error => Observable.throw(error))
      //.subscribe(data => this.success(data), error => console.log(error));
  }


  save(params){
      let user = this.sessionUser.get();
      params.data.terminal_id = user.id;
      //debugger

      let headers = new Headers();
			//console.log(formData);
			headers.append('Content-Type', 'application/json');
			headers.append('Accept', 'application/json');
      let options = new RequestOptions({ headers: headers });
      return this.http.post(Constants.API_URL + '/posts', params, options)
      .map(res => res.json());
      //.catch(error => Observable.throw(error))
      //.subscribe(data => this.success(data), error => console.log(error));
  }

}
