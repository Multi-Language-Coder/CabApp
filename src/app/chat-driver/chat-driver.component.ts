import { Component, OnInit } from '@angular/core';
import { WebSocketAPI } from '../WebSocketAPI.component';
import { HttpClient } from '@angular/common/http';
import { Cabdata } from '../../environments/cabdata.interface';
import { Chat, Message } from '../../environments/chat.interface';
import { User } from '../../environments/user.interface';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-chat-driver',
  standalone: false,
  
  templateUrl: './chat-driver.component.html',
  styleUrl: './chat-driver.component.css'
})
export class ChatDriverComponent implements OnInit {
  messagewbsckt!: WebSocketAPI;
  chatAvailable = false;
  newMessage = "";
  websocket!: WebSocketAPI;
  driverUser = "";
  id!:number;
  messages:Message[] = [];
  driverUserdata!: User;
  cabdata!:Cabdata;
  chatId!:number;
  username!:string;
  constructor(private http:HttpClient) {
    
  }
  ngOnInit(){
    const cookies = document.cookie.split(";");
    let username = "";
    for(let cookie of cookies){
      if(cookie.split("=")[0].includes("username")){
        username = cookie.split("=")[1];
        this.username = username;
        break;
      }
    }
    this.websocket = new WebSocketAPI();
    this.messagewbsckt = new WebSocketAPI();
    if(location.href.includes("driver")){
      this.websocket._connect("/topic/cabdatas");
      setTimeout(()=>{
        const int = setInterval(()=>{
          this.websocket._send("/app/cabdatas").then(val=>{
            const cabdatas: Cabdata[] = (JSON.parse(String(val)) as Cabdata[]);
            for(let cabdata of cabdatas){
              if(cabdata.driver != null && cabdata.driver == username && cabdata.chatAv){
                this.cabdata = cabdata;
                this.driverUser = cabdata.userrequested;
                this.chatAvailable = true;
                this.id = cabdata.cabid;
                this.initializeChat(int);
                break;
              }
            }
          });
        },1500)
        
      },1000)
    }else if(location.href.includes("showDetails")){
      this.websocket._connect("/topic/cabdata/{fleetId}");
    console.log(location.href.split("/")[4])
    this.id = parseInt(location.href.split("/")[4])
    console.log(this.id)
    setTimeout(()=>{
      this.wbsckt();
    },3000)
    }
  }
  trackByMessageIndex(index: number, message: Message): number {
    return index;
  }
  wbsckt(){
    
    const interval = setInterval(() => {
      this.websocket._send<Cabdata>(`/app/cabdata/${this.id}`).then((result)=>{
        result = (JSON.parse(String(result)) as Cabdata)
        if(result.driver != null || result.driver == ""){
          this.chatAvailable = true;
          this.driverUser = result.driver!;
          //this.driverUserdata = result;
          this.cabdata = result;
          this.initializeChat(interval)
        }
      },(error)=>{
        console.log(error)
      })
    },1500)
  }
  initializeChat(intervalId:NodeJS.Timeout){
    let d;
    if(location.href.includes("driver")){
      d = this.username;
    } else{
      d = this.driverUser;
    }
    clearInterval(intervalId);
    this.http.get<Chat>(environment.apiBaseUrl+`chate/${d}`).subscribe((val)=>{
      if(val != null){
        this.messages = JSON.parse(val.messages);
        this.chatId = val.chatid;
        this.getMessages();
      } else {
        this.http.get<number>(environment.apiBaseUrl+"countChats").subscribe((val)=>{
          const count = val+1;
          console.log(count)
          this.http.post<Chat>(environment.apiBaseUrl+"newChat",{
            name:this.driverUser,
            messages:"[]",
            chatid:count,
            involved:[this.driverUser,this.cabdata.userrequested],
            chatAv:true
          }).subscribe((val)=>{
            this.chatId = val.chatid;
            this.getMessages();
          })
        })
      }
    })
    
    
  }
  sendMessage() {
    this.http.get<Chat>(environment.apiBaseUrl+`chat/${this.chatId}`).subscribe((val)=>{
      const chat:Chat = val;
      let messages:Message[] = JSON.parse(chat.messages);
      const newMessage: Message = {
        sender: this.username,
        text: this.newMessage,
      }
      messages.push(newMessage);
      this.http.post(environment.apiBaseUrl+"addMsg",{
        name:chat.name,
        messages:JSON.stringify(messages),
        chatid:chat.chatid,
        involved:chat.involved
      }).subscribe((val)=>{
        this.messages = messages;
        this.newMessage = "";
      })
    });
    /*this.http.post(environment.apiBaseUrl+"addMsg",{
      chatid:this.chatId,
      message:this.newMessage,
      name:this.driverUser
    });*/
  }
  trackByChatId(index: number, chat: any): string {
    return chat.chatid; // Assuming 'chatid' is the unique ID
  }
  endChat(){
    this.chatAvailable = false;
    this.websocket._disconnect();
    this.messagewbsckt._disconnect();
    this.messages = [];
    this.chatId = -1;
    clearInterval(this.interval1);
    this.http.get(environment.apiBaseUrl+`endChat/${this.id}`).subscribe((val)=>{

    });
  }
  interval1!:NodeJS.Timeout;
  getMessages(){
    const wbsckt = new WebSocketAPI();
    setTimeout(()=>{
      wbsckt._connect("/topic/cabdata/{id}");
    this.messagewbsckt._connect("/topic/getInvChatsWeb/{name}");
    setTimeout(()=>{
      this.interval1 = setInterval(()=>{
        this.messagewbsckt._send(`/app/getInvChatsWeb/${this.username}`).then((val:any)=>{
          val = JSON.parse(val) as Chat[];
          if(val != null || val.length != 0){
            for(let chat of val){
            if(chat.chatid == this.chatId){
              this.messages = JSON.parse(chat.messages);
            }
          }
          }
          
        });
        wbsckt._send(`/app/cabdata/${this.id}`).then(val=>{
          const cabdata = (JSON.parse(String(val)) as Cabdata);
          console.log(cabdata,this.chatId)
          if(cabdata.chatAv == false){
            this.endChat();
            setTimeout(()=>{
              alert("User on other side of chat has ended the chat");
            },1000)
          }
        })
      },2000)
    },1000)
    },1000)
  }
}
