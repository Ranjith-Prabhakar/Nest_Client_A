import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CLIENT_URL } from './constants';

@WebSocketGateway({
  cors: {
    origin: [CLIENT_URL],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client A React tab connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client A React tab disconnected:', client.id);
  }

  sendMessageToClientATab(data: any) {
    this.server.emit('message-to-client-a', data);
  }
}
