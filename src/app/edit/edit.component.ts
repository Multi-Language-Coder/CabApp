import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { User } from '../user.component';
import { ActivatedRoute } from '@angular/router';
import { Cabdata } from '../cabdata.component';
@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css',
  host: {
    ngSkipHydration: 'true'
  },
  standalone:false
})
export class EditComponent {
  user=""
  link=""
  tablerows:HTMLCollectionOf<HTMLTableRowElement>| undefined=undefined;

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    
    this.route.params.subscribe(params =>{
      this.user=params['username']
      this.link="http://localhost:4200/insert/"+this.user;
    })
    this.loadData()
    this.numofpages=Math.ceil(this.cabdataArr.length/3)
    document.addEventListener("DOMContentLoaded",()=>{
      this.tablerows = document.getElementsByTagName("tr");
      for(let i = 0; i < this.tablerows.length; i++){
        let tr = this.tablerows.item(i);
        if(parseInt(tr!.id)>3){
          tr!.setAttribute("style","position:absolute; left: -9999px;")
        }
        if(this.numofpages==1){
          document.getElementById("next")!.className="page-item disabled"
        }
      }
    })
  }
  cabdataArr: Array<Cabdata> = []
  numofpages=0;
  currentpage=1;
  img=''
  //passwords: Array<string> = []
  numRows=3
  goTo(pgNum:number){
    for(let i = 0; i < this.tablerows!.length; i++){
      this.tablerows!.item(i)!.setAttribute("style","position:absolute; left: -9999px;")
    }
    const maxRow = pgNum*3;
      let rowIds = [maxRow-2, maxRow-1, maxRow]
      for(let i = 0; i < 3; i++){
        document.getElementById(""+rowIds[i])!.setAttribute("style","");
        if((document.getElementById(""+rowIds[i+1])!)==undefined){
          break;
        }
      }
      
      this.currentpage=pgNum;
      console.log(this.currentpage==this.numofpages)
      if(this.currentpage!=1 ){
        document.getElementById("prev")!.className="page-item"
        console.log("success")
      } if(this.currentpage==1){
        document.getElementById("prev")!.className="page-item disabled"
        console.log("success")
      } if(this.currentpage==this.numofpages){
        console.log("success")
        document.getElementById("next")!.className="page-item disabled"
      } if(this.currentpage<this.numofpages && this.currentpage>1){
        console.log("success")
        document.getElementById("next")!.className="page-item"
        document.getElementById("prev")!.className="page-item"
      } 
      console.log(this.currentpage==this.numofpages)
  }
  loadData() {
    this.http.get<Cabdata[]>("http://localhost:8080/getCabDetails").subscribe((cabdata) => {
      let i = 1;
      for(let cabdata1 of cabdata){
        if(cabdata1.userrequested == this.user){
          cabdata1.id=i;
          this.cabdataArr.push(cabdata1)
          i++
        }
      }
      /*console.log(userdata)
      
      for (let user of userdata) {
        if(i==21){
          break;
        }else{
          this.passwords.push(user.password)
          let len = user.password.length;
          user.password = ""
          for (let j = 0; j < len; j++) {
            user.password += "*"
          }
          this.users.push(user)
      i++;
        }
      }*/
      
    })
  }
  delete(id: number) {
    this.http.delete(`http://localhost:8080/cab/${id}`,{responseType:'text'}).subscribe((val) => {
      let divmsg = document.getElementById("divMsg");
      let msg = document.getElementById("msg");
      let span = document.createElement("span");
      span.innerHTML = "Cab Details successfully deleted.<br/>"
      msg?.appendChild(span)
      divmsg?.setAttribute("style", "display:block;background-color: lightskyblue; color:blue;")
      setInterval(() => {
        divmsg?.setAttribute("style", "display:none;background-color: lightskyblue; color:blue;")
        msg?.removeChild(span)
        location.reload()
      }, 5000)
    })
  }
  toUpdPg(id: number) {
    location.href = `/update/${id}?username=${this.user}`;
  }
  toChkPg(id:number){
    location.href=`/showDetails/${id}`
  }
}