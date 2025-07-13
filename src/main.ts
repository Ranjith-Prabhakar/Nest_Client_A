import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CLIENT_URL, RABBITMQ_URI } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_URI],
      queue: 'to-clientA',
      queueOptions: {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: 'to-clientA.retry',
      },
      noAck: false,
    },
  });

  app.enableCors({
    origin: [CLIENT_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
