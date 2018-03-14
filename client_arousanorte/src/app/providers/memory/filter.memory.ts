import { Injectable } from '@angular/core';

@Injectable()
export class FilterMem {

  private filter: any = {};

  constructor() {

  }

  public set(filter : any) {
    this.filter = filter;
  }

  public setValue(key:string, value : any) {
    this.filter[key] = value;
  }

  public get() :  any {
    return this.filter;
  }

  public clear() {
    this.filter = {};
  }

}
