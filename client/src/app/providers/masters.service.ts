import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
 
import { CountriesService } from './rest/countries.rest.service';
 
@Injectable()
export class MastersService {
    countries:any;
    constructor(
        private countriesRest: CountriesService
    ) { 

    }

    init(){
        return new Promise ((resolve,reject) => {
            // debugger
            this.countriesRest.find({order_by:'name_gl'}).subscribe(counties=>{
                this.countries = counties.result.data;
            })
        });
    }

    getCountryName(id){
        if(id){
            for(let i = 0; i<this.countries.length; i++){
                if(this.countries[i].id == id){
                    return this.countries[i].name_gl;
                }
            }
        }
        return '';
    }
 
    getCountries() {
        return this.countries;
    }

}