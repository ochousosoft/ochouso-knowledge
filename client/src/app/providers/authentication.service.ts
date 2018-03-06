import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map'

import { Constants } from './config/constants';

@Injectable()
export class AuthenticationService {
    session:Session = new Session('', [], {});
    constructor(private http: Http) { }

    login(username: string, password: string) {
        return this.http.post(Constants.API_URL +  '/login', JSON.stringify({ username: username, password: password }))
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let data = response.json();
                if (data && data.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    this.createSession(data.token);
                    let session = this.getSession();
                    //UserSrv.set(session);
                    return true;
                }
                else{
                    return false;
                }


            });
    }

    logout() {
        // remove user from local storage to log user out
        sessionStorage.removeItem('currentUser');
    }

    getSession(){
        return this.session;
    }

    base64DecodeUnicode(str){
        return decodeURIComponent(window.atob(str).replace(/(.)/g, (m: string, p: string)=>{
            var code = p.charCodeAt(0).toString(16).toUpperCase();
            if(code.length<2){
                code = '0' + code;
            }
            return '%' + code;
        }));
    }

    urlBase64Decode(str){
        let output = str.replace(/-/g, "+").replace(/_/g, "/");
        switch(output.length % 4){
            case 0:
                break;
            case 2:
                output += "==";
                break;
            case 3:
                output += "=";
                break;
            default:
                throw "Ilegal base64 string!";
        }

        try{
            return this.base64DecodeUnicode(output);
        }
        catch(err){
            return window.atob(output);
        }
    }

    createSession(token){
        window.sessionStorage.setItem('token', token);
        this.restoreSession();
    }

    restoreSession(){
        if(''===this.session.user && window.sessionStorage.hasOwnProperty('token')){
            let encodedProfile = window.sessionStorage.token.split('.')[1];
            let profile = JSON.parse(this.urlBase64Decode(encodedProfile));
            if(!Array.isArray(profile.roles)){
                profile.roles = [profile.roles];
            }
            this.session.roles = profile.roles;
            this.session.user = profile.user;
            this.session.data = profile.data;
        }
    }

    destroySession() {
        this.session.user = '';
        this.session.roles = [];
        this.session.data = {};
        delete window.sessionStorage.token;
    }

    isAuthenticated() {
        this.restoreSession();
        return !!this.session.user;
    }

    userHasRoles(authorizedRoles) {
		for (var i=0;i<this.session.roles.length;i++) {
			var currentSessionRole = this.session.roles[i];
			for (var j=0;j<authorizedRoles.length;j++) {
				if (currentSessionRole === authorizedRoles[j] || '*' === authorizedRoles[j]) {
					return true;
				}
			}
		}
		return false;
	}

    isAuthorized(authorizedRoles) {
        if (!Array.isArray(authorizedRoles)) {
            authorizedRoles = [authorizedRoles];
        }
        return (this.isAuthenticated() && this.userHasRoles(authorizedRoles));
    }

    getUserName(){
        return this.session.user;
    }


}

class Session{
    public user: string;
    public roles:string[];
    public data:any;
    constructor(_user, _roles, _data){
        this.user = _user;
        this.roles = _roles;
        this.data = _data;
    }
}
