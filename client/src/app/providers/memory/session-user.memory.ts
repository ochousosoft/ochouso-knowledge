import { Injectable } from '@angular/core';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class SessionUserMem {

  private user: any;

  constructor(
    private auth: AuthenticationService
  ) {
    
  }

  public get() :  any {
    let session = this.auth.getSession();
    this.user = session.data;

    return this.user;
  }
}
