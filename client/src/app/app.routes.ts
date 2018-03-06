import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './pages/login/login.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {SurveysComponent} from './pages/surveys/surveys.component';
import {SurveyDetailComponent} from './pages/survey-detail/survey-detail.component';
import { AuthGuard } from './guards/index';

const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]  },
  { path: 'surveys/:survey_type', component: SurveysComponent, canActivate: [AuthGuard]  },
  { path: 'surveys', component: SurveysComponent, canActivate: [AuthGuard]  },
  { path: 'survey-detail/:id/:survey_type', component: SurveyDetailComponent, canActivate: [AuthGuard]  },
  { path: 'survey-detail/:id', component: SurveyDetailComponent, canActivate: [AuthGuard]  },
  { path: 'new-survey/:survey_type', component: SurveyDetailComponent, canActivate: [AuthGuard]  },
  { path: 'new-survey', component: SurveyDetailComponent, canActivate: [AuthGuard]  },
  { path: '**', pathMatch: 'full', redirectTo: 'login' }
];

export const APP_ROUTING = RouterModule.forRoot(APP_ROUTES, {useHash:true});
