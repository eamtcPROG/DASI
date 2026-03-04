import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  if (!port) {
    throw new Error('PORT is not set');
  }
  const version = configService.get<string>('version');
  if (!version) {
    throw new Error('version is not set');
  }
  const rabbitmqUrl = configService.get<string>('rabbitmq.url');
  if (!rabbitmqUrl) {
    throw new Error('RABBITMQ_URL is not set');
  }

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'user',
      noAck: false,
      prefetchCount: 1,
      queueOptions: {
        durable: true,
      },
    },
  });
  const config = new DocumentBuilder()
    .setTitle('API Identity Service')
    .setDescription(
      'HTTP API for the Identity service. Manage identities, authentication, and other identity-related operations with versioned endpoints, validation, and standard error responses.',
    )
    .addBearerAuth(
      {
        description: `[just text field] Please enter token in following format: Bearer `,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
      },
      'jwt',
    )
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.startAllMicroservices();
  await app.listen(port);
}
void bootstrap();
