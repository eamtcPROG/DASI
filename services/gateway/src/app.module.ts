import { Module } from '@nestjs/common';
import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './controllers/auth.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { HealthController } from './controllers/health.controller';
import { GlobalErrorsInterceptor } from './interceptors/global-errors.interceptor';
import { GlobalResponseInterceptor } from './interceptors/global-response.interceptor';
import { AuthProxyService } from './services/auth-proxy.service';
import { AnalyticsProxyService } from './services/analytics-proxy.service';
import { HealthService } from './services/health.service';
import { RealtimeModule } from './realtime/realtime.module';
import { JwtGuard } from './auth/jwt.guard';

function getRequiredConfig(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new Error(`${key} is not configured`);
  }

  return value;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/env/.env.${process.env.NODE_ENV}`,
      load: [configuration],
    }),
    ClientsModule.registerAsync([
      {
        name: 'IDENTITY_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [getRequiredConfig(config, 'rabbitmq.url')],
            queue: getRequiredConfig(config, 'rabbitmq.identityQueue'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
      {
        name: 'ANALYTICS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [getRequiredConfig(config, 'rabbitmq.url')],
            queue: getRequiredConfig(config, 'rabbitmq.analyticsQueue'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
    RealtimeModule,
  ],
  controllers: [AuthController, AnalyticsController, HealthController],
  providers: [
    AuthProxyService,
    AnalyticsProxyService,
    HealthService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalErrorsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
  ],
})
export class AppModule {}
