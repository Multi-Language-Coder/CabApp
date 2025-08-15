import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor( @Inject(HttpClient) private http: HttpClient) { }

  login(credentials: any) {
    return this.http.post<any>(`https://localhost:8080/check`, credentials)
  }
}
