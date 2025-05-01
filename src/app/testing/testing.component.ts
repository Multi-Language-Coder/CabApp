import { Component } from '@angular/core';

@Component({
  selector: 'app-testing',
  standalone: false,
  
  templateUrl: './testing.component.html',
  styleUrl: './testing.component.css'
})
export class TestingComponent {
  strings: string[] = []
  i = 0;
  ngOnInit(){
    const alphabet = "abcdefghijklmnopqrstuvwsyzABCDEFGHIJKLMNOPQRSTUVWSYZ";
    setInterval(()=>{
      this.strings.push(alphabet[this.i])
      this.i+=1;
    },1000)
  }
}
