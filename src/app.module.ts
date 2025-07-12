import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CLIENT_A_SERVICE_RABBITMQ } from './constants';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SocketGateway } from './socket.gateway';
import { RabbitQueueInitializer } from './rabbit-queue.initializer';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: CLIENT_A_SERVICE_RABBITMQ,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672?heartbeat=60'],
          queue: 'to-clientB',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': 'to-clientB.retry',
            },
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [SocketGateway, RabbitQueueInitializer],
})
export class AppModule {}
