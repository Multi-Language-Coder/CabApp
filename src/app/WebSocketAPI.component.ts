import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { WebsockettestComponent } from './websockettest/websockettest.component';

export class WebSocketAPI {
    webSocketEndPoint: string = 'http://localhost:8080/ws';
    topic!: string;
    stompClient!: Stomp.Client;
    result:any;
    constructor(){
    }
    _connect(topic:string) {
        console.log("Initialize WebSocket Connection");
        let ws = new SockJS(this.webSocketEndPoint);
        this.stompClient = Stomp.over(ws);
        const _this = this;
        this.topic=topic;
        _this.stompClient.connect({},  (frame:any) => {
            _this.stompClient.subscribe(topic,  (sdkEvent:any) => {
                this.result=JSON.parse(sdkEvent.body);
                //_this.onMessageReceived(sdkEvent);
            });
            //_this.stompClient.reconnect_delay = 2000;
        }, this.errorCallBack);
    };

    _disconnect() {
            this.stompClient.disconnect(()=>{
                //console.log("disconnected");
            });
        console.log("Disconnected");
    }

    // on error, schedule a reconnection attempt
    errorCallBack(error:any) {
        console.log("errorCallBack -> " + error)
        setTimeout(() => {
            this._connect(this.topic);
        }, 5000);
    }

 /**
  * Send message to sever via web socket
  * @param {*} message 
  */
    _send(destination:string) {
        console.log("calling logout api via web socket");
        //this.stompClient.send("/app/msg/stringy", {}, JSON.stringify(message));
        this.stompClient.send(destination, {}, JSON.stringify({
            
        }));
    }

    onMessageReceived(message:any) {
        console.log("Message Recieved from Server :: " + message);
        //this.appComponent.handleMessage(JSON.stringify(message.body));
    }
}