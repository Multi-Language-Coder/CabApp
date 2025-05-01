import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../environments/user.interface';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../auth-service.service';
@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.css',
  standalone:false
})

export class LogInComponent {
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService:AuthService
  ) {
    this.isConsented = this.getCookie("username") == 'username';
    
    document.getElementById("sub")?.addEventListener("click", this.login);
  }
  getCookie(name:string){
    let ca: Array<string> = document.cookie.split(';');
        let caLen: number = ca.length;
        let cookieName = `${name}=`;
        let c: string;

        for (let i: number = 0; i < caLen; i += 1) {
            c = ca[i].replace(/^\s+/g, '');
            if (c.indexOf(cookieName) == 0) {
                return c.substring(cookieName.length, c.length);
            }
        }
        return '';
  }
  deleteCookie(name:string) {
    this.setCookie(name, '', -1);
  }

  setCookie(name: string, value: string, expireDays: number, path: string = '') {
    let d:Date = new Date();
    d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
    let expires:string = `expires=${d.toUTCString()}`;
    let cpath:string = path ? `; path=${path}` : '';
    document.cookie = `${name}=${value}; ${expires}${cpath}`;
  }
  isConsented: boolean = false;
  username = new FormControl("");
  password = new FormControl("");
  error: string | null = null;

  login(): void {
    if (!this.username.value || !this.password.value) {
      this.showError('Please enter both username and password');
      return;
    }

    const credentials = {
      username: this.username.value.trim(),
      password: this.password.value
    };

    this.authService.login(credentials)
      .subscribe({
        next: (response:any) => {
            //this.authService.setToken(response.token);
            if(response == null){
              this.showError("Invalid credentials")
            }
            else{
              if(!this.isConsented){
                this.setCookie("username",credentials.username,3)
              }
              this.router.navigate([response.isDriver ? '/driver' : '/edit']);
            }
            

        },
        error: (error:any) => console.error('Login error:', error)
      });
  }

  private showError(message: string): void {
    this.error = message;
  }
}
