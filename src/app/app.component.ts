import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone:false
})
export class AppComponent {
  title = 'CabApp';
  clearCookie(){
    document.cookie=''
  }
  constructor(){
    const cookies = document.cookie.split(";");
    let c = ""
    for(let cookie of cookies){
      if(cookie.includes("username")){
        c = cookie;
        break;
      }
    }
    console.log(c)
    if((!document.cookie.includes("username") && !(location.href.includes("login") || location.href.includes("signup"))) || (c.split("=")[1]=="" && !location.href.includes("login") && !location.href.includes("signup"))){
      location.href="/login"
    }
  }
}
