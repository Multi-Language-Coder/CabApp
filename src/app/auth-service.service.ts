import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor( @Inject(HttpClient) private http: HttpClient) { }

  login(credentials: any) {
    return this.http.post<any>(`https://54.211.241.95:8443/check`, credentials)
  }
}
