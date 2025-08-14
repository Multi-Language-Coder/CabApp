import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GoogleMapsModule } from '@angular/google-maps';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EditComponent } from './edit/edit.component';
import { InsertcabdetailsComponent } from './insertcabdetails/insertcabdetails.component';
import { LogInComponent } from './log-in/log-in.component';
import { MapapiComponent } from './mapapi/mapapi.component';
import { ShowDetailsComponent } from './show-details/show-details.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { UpdateComponent } from './update/update.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UpperCasePipe, NgFor } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { DriverComponent } from './driver/driver.component';
import {provideRouter, RouterOutlet} from '@angular/router';

import { WebsockettestComponent } from './websockettest/websockettest.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import {routes} from './app.routes';
import {getAuth, provideAuth} from "@angular/fire/auth";
import {initializeApp, provideFirebaseApp} from "@angular/fire/app";
import {environment} from "../environments/environment";
import { ErrorpageComponent } from './errorpage/errorpage.component';
import { PictureComponent } from './picture/picture.component';
import { UpdateCarDetailsComponent } from './update-car-details/update-car-details.component';
import { NgxCsvParserModule } from 'ngx-csv-parser';
import { TestingComponent } from './testing/testing.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChatDriverComponent } from './chat-driver/chat-driver.component';

@NgModule({
  declarations: [
    AppComponent,
    EditComponent,
    InsertcabdetailsComponent,
    LogInComponent,
    MapapiComponent,
    ShowDetailsComponent,
    SignUpComponent,
    UpdateComponent,
    DriverComponent,
    WebsockettestComponent,
    ProfilePageComponent,
    ErrorpageComponent,
    PictureComponent,
    UpdateCarDetailsComponent,
    TestingComponent,
    ForgotPasswordComponent,
    ChatDriverComponent
    ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    UpperCasePipe,
    NgFor,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule,
    GoogleMapsModule,
    NgxCsvParserModule,
  ],
  providers: [
    provideFirebaseApp(()=> initializeApp(environment.firebase)),
    provideAuth(()=> getAuth()),
    provideRouter(routes),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
