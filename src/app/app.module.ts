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
import { WebsockettestComponent } from './websockettest/websockettest.component';
import { WebSocketService } from './web-socket.service';
import { WebSocketAPI } from './WebSocketAPI.component';

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
    GoogleMapsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
