import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { environment } from '../../environments/environment';
import { User } from '../user.component';
import { Country } from '../region.component';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
    name= new FormControl('')
    username= new FormControl('')
    password= new FormControl('')
    description= new FormControl('')
    lastId: number = 0;

  constructor(private http: HttpClient, private router: Router) {
    this.http.get<User[]>(`${environment.apiBaseUrl}/users`).subscribe((users) => {
      this.lastId = users.length;
      console.log(this.lastId)
    })
    navigator.geolocation.getCurrentPosition((position)=>{
      const geocoder = new google.maps.Geocoder();
    })
    this.http.get<Country[]>("https://raw.githubusercontent.com/country-regions/country-region-data/refs/heads/master/data.json").subscribe(val => {
      for(let country of val){
        
      }
    })
  }
  onSubmit() {
    // Basic validation
    if (!this.name.value || !this.username.value || !this.password.value) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if username already exists
    this.http.post<any>(`${environment.apiBaseUrl}/check`,{username: this.username.value,password: this.password.value})
      .subscribe((exists) => {
          if (exists) {

            alert('Username already exists. Please choose another.');
          } else {
            this.registerUser();
          }
        })
      };

  private registerUser() {
    this.http.post('http://localhost:8080/users', {
      name: this.name.value,
      username: this.username.value,
      password: this.password.value,
      description: this.description.value,
      isDriver: (document.getElementById('roles') as HTMLSelectElement).value === 'true',
      position: [],
      status: "Available",
      id:this.lastId
    })
      .subscribe({
        next: (response) => {
          alert('Registration successful!');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          alert('Registration failed. Please try again.');
        }
      });
  }
} 