import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmaildashboardComponent } from './emaildashboard/emaildashboard.component';
import { LoginComponent } from './login/login.component';

import {
  AngularFireAuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToHome = () => {
  redirectLoggedInTo(['mailbox']);
};

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    component: LoginComponent,
    // canActivate: [AngularFireAuthGuard],

    // data: { authGuardPipe: redirectLoggedInToHome },
  },
  {
    path: 'mailbox',
    component: EmaildashboardComponent,
    // canActivate: [AngularFireAuthGuard],
    // data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'mailbox',
    component: EmaildashboardComponent,
    // canActivate: [AngularFireAuthGuard],
    // data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: '**',
    component: PagenotfoundComponent,
    // canActivate: [AngularFireAuthGuard],
    // data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
