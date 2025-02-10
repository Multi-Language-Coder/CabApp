import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User } from '../user.component';
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
    document.getElementById("sub")?.addEventListener("click", this.login);
  }

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
              this.router.navigate([response.isDriver ? '/driver' : '/edit', response.username]);
            }
            

        },
        error: (error:any) => console.error('Login error:', error)
      });
  }

  private showError(message: string): void {
    this.error = message;
  }
}
