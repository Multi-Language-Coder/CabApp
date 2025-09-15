import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { WebsockettestComponent } from './websockettest/websockettest.component';
import { Observable, Subject } from 'rxjs';
import { Type } from '@angular/core';
import { environment } from '../environments/environment';
export class WebSocketAPI {
    StompWithNoDebug = Stomp;
    webSocketEndPoint: string = environment.apiBaseUrl+"ws";
    topic!: string;
    stompClient!: Stomp.Client;
    result: any;
    private responseSubject = new Subject<any>();
    public response$ = this.responseSubject.asObservable();
    private connectionPromise: Promise<void> | null = null;
    constructor() {
    }
    async _connect(topic: string):Promise<void> {
        if (!this.connectionPromise) {
            this.connectionPromise = new Promise<void>((resolve, reject) => {
                console.log("Initialize WebSocket Connection");
                let ws = new SockJS(this.webSocketEndPoint, null, {
  transports: ['websocket', 'xhr-streaming', 'xhr-polling']
});
                this.stompClient = Stomp.over(ws);
                const _this = this;
                this.topic = topic;
                _this.stompClient.connect({}, (frame: any) => {
                    _this.stompClient.subscribe(topic, (sdkEvent: any) => {
                        const result = sdkEvent.body;
                        this.responseSubject.next(result); // Emit the result
                    });
                    resolve(); // Resolve the Promise when connected
                }, (error: any) => {
                    this.errorCallBack(error);
                    reject(error); // Reject the Promise on error
                });
            });
        }
        return this.connectionPromise;
    };

    _disconnect() {
        this.stompClient.disconnect(() => {
            //console.log("disconnected");
        });
        console.log("Disconnected");
    }

    // on error, schedule a reconnection attempt
    errorCallBack(error: any) {
        console.log("errorCallBack -> " + error)
        setTimeout(() => {
            this._connect(this.topic);
        }, 5000);
    }

    /**
     * Send message to sever via web socket
     * @param {*} message 
     * **/
    async _send<T>(destination: string,body?:string): Promise<any> {
        if (!this.stompClient || !this.stompClient.connected) {
            await this._connect(this.topic); // Ensure connected before sending
        }
        if(body == null){
            body = "";
        }
        return new Promise<T>((resolve, reject) => {
            const subscription = this.response$.subscribe(
                (response) => {
                    resolve(response);
                    subscription.unsubscribe();  //prevent multiple emits
                },
                (error) => {
                    reject(error);
                    subscription.unsubscribe();
                }
            );
            this.stompClient.send(destination, {}, JSON.stringify(body));
        });
    }

    onMessageReceived(message: any) {
        //console.log("Message Recieved from Server :: " + message);
        //this.appComponent.handleMessage(JSON.stringify(message.body));
    }
}
