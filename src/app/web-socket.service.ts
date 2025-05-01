import * as Stomp from 'stompjs';
import SockJs from 'sockjs-client';
import { Injectable } from '@angular/core';

@Injectable()
export class WebSocketService {

    // Open connection with the back-end socket
    public connect() {
        let socket = new SockJs(`http://localhost:8080/ws`);

        let stompClient = Stomp.over(socket);

        return stompClient;
    }
}