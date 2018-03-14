import { Injectable } from '@angular/core';
import { RequestOptions, Headers, Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { Constants } from '../config/constants';

@Injectable()
export class LoginService {

  constructor(private http: Http) { }

  login(){
    let headers = new Headers();
			//console.log(formData);
			headers.append('Content-Type', 'application/json');
			headers.append('Accept', 'application/json');
      let options = new RequestOptions({ headers: headers });
      return this.http.post(Constants.API_URL + '/test', options)
      .map(res => res.json());
      //.catch(error => Observable.throw(error))
      //.subscribe(data => this.success(data), error => console.log(error));
  }

}
