import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Create microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5672'],
      queue: 'to-clientA',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start the microservice
  await app.startAllMicroservices();

  // Start the HTTP server
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
