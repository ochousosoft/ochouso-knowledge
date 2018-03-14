import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ToastsManager, ToastOptions } from 'ng2-toastr/ng2-toastr';
import { MastersService } from './providers/masters.service';
import { AuthenticationService } from './providers/authentication.service';
import {TranslateService} from "ng2-translate";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  Auth;

  constructor(
    private mastersService: MastersService,
    public toastr: ToastsManager, 
    vRef: ViewContainerRef,
    authenticationService: AuthenticationService,
    public translate: TranslateService
  ){
    this.toastr.setRootViewContainerRef(vRef);
    // mastersService.init();

    this.Auth = authenticationService;

    translate.setDefaultLang('gl');
  }
}
