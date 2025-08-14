const WebSocket = require('ws');

const user_id = '1211391728943366196';

const ws = new WebSocket(`wss://websocket.joshlei.com/growagarden?user_id=${encodeURIComponent(user_id)}`);

ws.on('open', () => {
  console.log('WebSocket connection established.');
});

ws.on('message', (data) => {
  console.log('\nMessage from server:', data.toString());
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed.');
});