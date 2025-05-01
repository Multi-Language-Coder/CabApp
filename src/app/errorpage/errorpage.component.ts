import { Component } from '@angular/core';

@Component({
  selector: 'app-errorpage',
  standalone: false,
  
  templateUrl: './errorpage.component.html',
  styleUrl: './errorpage.component.css'
})
export class ErrorpageComponent {
  constructor(){
    
  }
  ngOnInit(){
    (document.getElementById("gb") as HTMLButtonElement).addEventListener("click",()=>{
      if(document.cookie != ''){
        location.href=`/edit/${document.cookie.split("=")[1]}`
      } else {
        location.href=`/login`
      }
      console.log(document.cookie)
      
    })
  }
}
