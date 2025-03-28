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

export const routes: Routes = [
    { path: 'edit/:username', component: EditComponent },
    { path: 'signup', component: SignUpComponent },
    { path: 'login', component: LogInComponent },
    { path: 'update/:id', component: UpdateComponent },
    { path: '', redirectTo: 'signup', pathMatch: 'full' },
    { path: 'insert/:username', component:InsertcabdetailsComponent},
    { path: 'showDetails/:id', component:ShowDetailsComponent},
    { path:'tracking/:id',component:MapapiComponent},
    { path:'driver/:username',component:DriverComponent},
    { path:'websocket', component:WebsockettestComponent}
];
@NgModule({
    imports: [RouterModule.forRoot(routes),],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
