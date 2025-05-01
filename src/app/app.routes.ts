import { RouterModule, Routes } from '@angular/router';
import { LogInComponent } from './log-in/log-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { EditComponent } from './edit/edit.component';
import { NgModule } from '@angular/core';
import { UpdateComponent } from './update/update.component';
import { InsertcabdetailsComponent } from './insertcabdetails/insertcabdetails.component';
import { ShowDetailsComponent } from './show-details/show-details.component';
import { MapapiComponent } from './mapapi/mapapi.component';
import { DriverComponent } from './driver/driver.component';
import { WebsockettestComponent } from './websockettest/websockettest.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ErrorpageComponent } from './errorpage/errorpage.component';
import { PictureComponent } from './picture/picture.component';
import { TestingComponent } from './testing/testing.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChatDriverComponent } from './chat-driver/chat-driver.component';

export const routes: Routes = [
    { path: 'edit', component: EditComponent, canActivateChild:[/*AuthGuard*/]},
    { path: 'signup', component: SignUpComponent },
    { path: 'login', component: LogInComponent },
    { path: 'update/:id', component: UpdateComponent, canActivateChild:[/*AuthGuard*/] },
    { path: '', redirectTo: 'signup', pathMatch: 'full' },
    { path: 'insert', component:InsertcabdetailsComponent, canActivateChild:[/*AuthGuard*/]},
    { path: 'showDetails/:id', component:ShowDetailsComponent, canActivateChild:[/*AuthGuard*/]},
    { path:'tracking/:id',component:MapapiComponent, canActivateChild:[/*AuthGuard*/]},
    { path:'driver',component:DriverComponent, canActivateChild:[/*AuthGuard*/]},
    { path: 'profilePage', component: ProfilePageComponent, canActivateChild:[/*AuthGuard*/]},
    { path:'websocket', component:WebsockettestComponent},
    { path:'picture', component:PictureComponent},
    { path:'testing', component:TestingComponent},
    { path:"**", component: ErrorpageComponent},
    { path:"forgotPassword",component:ForgotPasswordComponent},
    { path:"jevil/:id", component: ChatDriverComponent }
];
@NgModule({
    imports: [RouterModule.forRoot(routes),],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
