import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import {JwtModule} from "@auth0/angular-jwt";

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    importProvidersFrom([
    // ...
      JwtModule.forRoot({
        config: {
          tokenGetter: () => localStorage.getItem('token')
        }
      })
    ])
  ]
};