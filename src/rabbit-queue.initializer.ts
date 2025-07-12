/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitQueueInitializer implements OnModuleInit {
  async onModuleInit() {
    const conn = await amqp.connect('amqp://guest:guest@localhost:5672');
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
