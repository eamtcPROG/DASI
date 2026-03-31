import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  const configService = app.get(ConfigService);

  const port = configService.get<number>('port') ?? 3005;
  const rabbitmqUrl = configService.get<string>('rabbitmq.url');
  const notificationQueue =
    configService.get<string>('rabbitmq.notificationQueue') ?? 'notification';

  if (!rabbitmqUrl) {
    throw new Error('RABBITMQ_URI is not set');
  }

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: notificationQueue,
      noAck: false,
      prefetchCount: 1,
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
  logger.log(`Notification service running on port ${port}`);
}

void bootstrap();
