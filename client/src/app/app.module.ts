import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule }    from '@angular/forms';
import { Http, HttpModule } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { BaseRequestOptions } from '@angular/http';

import { ScrollToModule } from 'ng2-scroll-to-el';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import{ ToastModule, ToastsManager, ToastOptions } from 'ng2-toastr/ng2-toastr';
import {TranslateLoader, TranslateStaticLoader, TranslateModule} from "ng2-translate";

import { MyDatePickerModule } from 'mydatepicker';
import { MultiselectDropdownModule } from 'angular-2-dropdown-multiselect';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import { BootstrapModalModule } from 'ng2-bootstrap-modal';

import {FocusModule} from 'angular2-focus';
import { ChartsModule } from 'ng2-charts';

import { MultiSelectComponent } from "ng2-group-multiselect";

//Routing
import {APP_ROUTING} from './app.routes';

//Components
import { AppComponent } from './app.component';
import { NavComponent } from './components/nav/nav.component';
import { FooterComponent } from './components/footer/footer.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SurveysComponent } from './pages/surveys/surveys.component';
import { SurveyDetailComponent } from './pages/survey-detail/survey-detail.component';
import { CollapsibleLeftSidebarComponent } from './components/collapsible-left-sidebar/collapsible-left-sidebar.component';

import { ConfirmComponent } from './components/confirm.component/confirm.component';
import { ExportDialogComponent } from './components/export-dialog.component/export-dialog.component';

//Rest providers
import { LoginService } from './providers/rest/login.rest.service';
import { fakeBackendProvider } from './helpers/index';
import { SurveysService } from './providers/rest/surveys.rest.service';
import { ReportsService } from './providers/reports.service';
import { PostsRestService } from './providers/rest/posts.rest.service';

//Memory providersimport
import { SurveyMem } from './providers/memory/survey.memory';
import { FilterMem } from './providers/memory/filter.memory';
import { SessionUserMem } from './providers/memory/session-user.memory';



import { AlertComponent } from './directives/index';
import { AuthGuard } from './guards/index';
import { AlertService, AuthenticationService, UserService } from './providers/index';


//Pages
import { UsersComponent, LoginComponent } from './pages/index';
import { SimpleQuestionComponent } from './components/simple-question/simple-question.component';
import { CheckboxesQuestionComponent } from './components/checkboxes-question/checkboxes-question.component';
import { NumericQuestionComponent } from './components/numeric-question/numeric-question.component';
import { NumericMultipleQuestionComponent } from './components/numeric-multiple-question/numeric-multiple-question.component';
import { SelectQuestionComponent } from './components/select-question/select-question.component';
import { YesnoQuestionComponent } from './components/yesno-question/yesno-question.component';


import { MastersService } from './providers/masters.service';
import { CountriesService } from './providers/rest/countries.rest.service';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SatisfactionQuestionComponent } from './components/satisfaction-question/satisfaction-question.component';
import { AutocompleteComponent } from './directives/autocomplete/autocomplete.component';


export function translatingStaticLoader(http: Http) {
  return new TranslateStaticLoader(http, '../assets/i18n', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    FooterComponent,
    DashboardComponent,
    SurveysComponent,
    SurveyDetailComponent,
    CollapsibleLeftSidebarComponent,
    AlertComponent,
    UsersComponent,
    LoginComponent,
    SimpleQuestionComponent,
    CheckboxesQuestionComponent,
    NumericQuestionComponent,
    NumericMultipleQuestionComponent,
    SelectQuestionComponent,
    YesnoQuestionComponent,
    SpinnerComponent,
    SatisfactionQuestionComponent,
    AutocompleteComponent,
    MultiSelectComponent,
    ConfirmComponent,
    ExportDialogComponent
  ],
  imports: [
    BrowserModule,
    APP_ROUTING,
    HttpModule,
    FormsModule,
    FocusModule.forRoot(),
    ScrollToModule.forRoot(),
    ToastModule, BrowserAnimationsModule,
    TranslateModule.forRoot({
            provide: TranslateLoader,
            useFactory: translatingStaticLoader,
            deps: [Http]
    }),
    ChartsModule,
    MyDatePickerModule,
    MultiselectDropdownModule,
    AngularMultiSelectModule,
    BootstrapModalModule
  ],
  entryComponents:[
    ConfirmComponent,
    ExportDialogComponent
  ],
  providers: [
    AuthGuard,
    LoginService,
    AuthenticationService,
    AlertService,
    UserService,
    SurveysService,
    PostsRestService,
    ReportsService,
    
    MastersService,
    CountriesService,
    // providers used to create fake backend
    fakeBackendProvider,
    MockBackend,
    BaseRequestOptions,

    ToastsManager,
    ToastOptions,

    SurveyMem,
    FilterMem,
    SessionUserMem
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
