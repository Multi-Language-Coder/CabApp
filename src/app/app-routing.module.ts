import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditComponent } from './edit/edit.component';
import { InsertcabdetailsComponent } from './insertcabdetails/insertcabdetails.component';
import { LogInComponent } from './log-in/log-in.component';
import { MapapiComponent } from './mapapi/mapapi.component';
import { ShowDetailsComponent } from './show-details/show-details.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { UpdateComponent } from './update/update.component';
import { DriverComponent } from './driver/driver.component';
import { WebsockettestComponent } from './websockettest/websockettest.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChatDriverComponent } from './chat-driver/chat-driver.component';

const routes: Routes = [{ path: 'edit/:username', component: EditComponent },
{ path: 'signup', component: SignUpComponent },
{ path: 'login', component: LogInComponent },
{ path: 'update/:id', component: UpdateComponent },
{ path: '', redirectTo: 'signup', pathMatch: 'full' },
{ path: 'insert/:username', component: InsertcabdetailsComponent },
{ path: 'showDetails/:id', component: ShowDetailsComponent },
{ path: 'tracking/:id', component: MapapiComponent },
{ path: 'driver/:username',component:DriverComponent},
{ path:'websocket', component:WebsockettestComponent},
{ path:"forgotPassword",component:ForgotPasswordComponent},
{ path:"jevil/:id", component: ChatDriverComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
