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
      console.log('Message received from client B:', body);

      const retryCount = body.retries ?? 0;
      if (retryCount > 2) {
        console.warn('Message exceeded retry limit. Sending to DLQ:', body);
        channel.sendToQueue(
          'to-clientA.dlq',
          Buffer.from(JSON.stringify(body)),
          {
            persistent: true,
            contentType: 'application/json',
          },
        );
        channel.ack(originalMessage);
        return;
      }

      // Simulate potential processing failure
      // if (Math.random() < 0.3) throw new Error('Simulated failure');

      this.socketGateway.sendMessageToClientATab(body);
      channel.ack(originalMessage);
    } catch (err) {
      console.error('Error processing message:', err);

      const retryCount = body.retries ?? 0;
      const updatedMsg = {
        ...body,
        retries: retryCount + 1,
      };

      channel.sendToQueue(
        'to-clientA.retry',
        Buffer.from(JSON.stringify(updatedMsg)),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );

      channel.ack(originalMessage);
    }
  }
}
