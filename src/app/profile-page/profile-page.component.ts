import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { User } from '../../environments/user.interface';

@Component({
  selector: 'app-profile-page',
  standalone: false,
  
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent {
  username: string = "Not Found"
  user: User = {
    name:"Loading",
    username:"Loading",
    password: "Loading",
    description:"Loading",
    isDriver: false,
    town:"Randallstown",
    state:"MD",
    id:0,
    zipcode:24556,
    position:[],
    imageLink:'',
    carType:''
  };
  imageLink = ""
  constructor(private http:HttpClient){

  }
  driver!:boolean;
  ngOnInit(){
    const cookies = document.cookie.split(";")
    let username = "";
    console.log(cookies);
    for(let cookie of cookies){
      console.log(cookie.split("=")[0].includes("username"))
      if(cookie.split("=")[0].includes("username")){
        this.username = cookie.split("=")[1];
        break;
      }
    }
    console.log(username)
    this.http.get<User>(`http://3.80.129.158:8080/user1/${this.username}`).subscribe((val)=>{
      val.password = "*************"
      this.user = val;
      this.http.get(`http://3.80.129.158:8080/image/${val.imageLink}`,{responseType:"blob"}).subscribe(val => {
        this.imageLink = URL.createObjectURL(val);
      })
      this.driver = val.isDriver;
      console.log(this.user)
    })
  }
}
