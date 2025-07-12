/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CLIENT_A_SERVICE_RABBITMQ, MESSAGE_FORMAT } from './constants';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { SocketGateway } from './socket.gateway';

@Controller()
export class AppController {
  constructor(
    @Inject(CLIENT_A_SERVICE_RABBITMQ) private readonly client: ClientProxy,
    private readonly socketGateway: SocketGateway,
  ) {}

  @Post('/message-to-b')
  sendMessageToClientB(@Body() body: MESSAGE_FORMAT) {
    this.client.emit('message-from-client-A', body);
    return { message: 'message sent to rabbitMQ', body };
  }

  @MessagePattern('message-from-client-B')
  handleMessageFromClientB(
    @Payload() body: MESSAGE_FORMAT,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      console.log('message received from client B ', body);
      this.socketGateway.sendMessageToClientATab(body);
      channel.ack(originalMessage);
    } catch (err) {
      console.error('Error while processing message:', err);
      channel.nack(originalMessage, false, false);
    }
  }
}
