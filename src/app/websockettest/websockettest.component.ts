import { Component } from '@angular/core';
import { WebSocketAPI } from '../WebSocketAPI.component';
import {WebSocketService} from "../web-socket.service";

/*@Component({
    selector: 'app-root',
    standalone:false,
    templateUrl: './websockettest.component.html',
    styleUrls: ['./websockettest.component.css']
})
export class WebsockettestComponent {

    public notifications = 0;

    constructor(private webSocketService: WebSocketService) {

		// Open connection with server socket
        let stompClient = this.webSocketService.connect();
        stompClient.connect({}, frame => {

			// Subscribe to notification topic
            stompClient.subscribe('/topic/notification', notifications => {

				// Update notifications attribute with the recent messsage sent from the server
                this.notifications = JSON.parse(notifications.body).count;
            })
        });
    }
}*/
@Component({
  selector: 'app-websockettest',
  standalone: false,
  
  templateUrl: './websockettest.component.html',
  styleUrl: './websockettest.component.css'
})
export class WebsockettestComponent {
  
  greeting: any;
  webSocketAPI!: WebSocketAPI;
  name!: string;
  ngOnInit() {
    this.webSocketAPI = new WebSocketAPI();
  }

  connect(){
    this.webSocketAPI._connect("/topic/cabdata/{fleetId}");
  }

  disconnect(){
    this.webSocketAPI._disconnect();
  }

  sendMessage(){
    this.webSocketAPI._send('/app/cabdata/3');
  }

  handleMessage(message:any){
    this.greeting = message;
  }
}