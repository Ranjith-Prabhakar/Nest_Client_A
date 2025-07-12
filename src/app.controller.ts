import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { CLIENT_A_SERVICE_RABBITMQ, MESSAGE_FORMAT } from './constants';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CLIENT_A_SERVICE_RABBITMQ) private readonly client: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/message-to-b')
  sendMessageToClientB(@Body() body: MESSAGE_FORMAT) {
    this.client.emit('message-from-client-A', body);
    return { message: 'message sent to rabbitMQ', body };
  }

  @MessagePattern('message-from-client-B')
  handleMessageFromClientB(@Payload() body: MESSAGE_FORMAT) {
    console.log('message received from client B ', body);
  }
}
