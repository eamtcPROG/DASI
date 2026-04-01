import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  console.log('[Analytics] Starting (MongoDB)');
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3004;
  const version = config.get<string>('version') ?? '1.0.0';
  const rabbitmqUrl = config.get<string>('rabbitmq.url');
  const queue = config.get<string>('rabbitmq.queue') ?? 'analytics';

  if (!rabbitmqUrl) {
    throw new Error('RABBITMQ_URI is not set in the environment variables. ');
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Analytics Service')
    .setDescription('Stores and serves platform analytics.')
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue,
      noAck: false,
      prefetchCount: 1,
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
}
void bootstrap();
