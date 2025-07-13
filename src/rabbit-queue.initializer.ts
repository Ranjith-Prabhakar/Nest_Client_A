import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { RABBITMQ_URI } from './constants';

@Injectable()
export class RabbitQueueInitializer implements OnModuleInit {
  async onModuleInit() {
    const conn = await amqp.connect(RABBITMQ_URI);
    const channel = await conn.createChannel();

    await channel.assertQueue('to-clientA.dlq', {
      durable: true,
    });

    await channel.assertQueue('to-clientA.retry', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': 'to-clientA',
        'x-message-ttl': 10000,
      },
    });

    await channel.assertQueue('to-clientA', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': 'to-clientA.retry',
      },
    });

    await channel.close();
    await conn.close();
  }
}
