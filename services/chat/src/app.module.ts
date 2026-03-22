import { Module } from "@nestjs/common";
import configuration from "./config/configuration";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { GlobalErrorsInterceptor } from "./interceptors/global-errors.interceptor";
import { GlobalResponseInterceptor } from "./interceptors/global-response.interceptor";
import { ChatService } from "./services/chat.service";
import { ChatController } from "./controllers/chat.controller";
import { ChatEventController } from "./events/chat.event.controller";
import { ChatGateway } from "./websocket/chat.gateway";
import { Room } from "./models/chat.model";
import { RoomMember } from "./models/chat.model";
import { Message } from "./models/chat.model";

function getRequiredConfig(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/env/.env.${process.env.NODE_ENV}`,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: "postgres",
          host: config.get<string>("database.host"),
          port: config.get<number>("database.port"),
          username: config.get<string>("database.username"),
          password: config.get<string>("database.password"),
          database: config.get<string>("database.database"),
          synchronize: true,
          entities: [Room, RoomMember, Message],
        };
      },
    }),
    TypeOrmModule.forFeature([Room, RoomMember, Message]),
    ClientsModule.registerAsync([
      {
        name: "ANALYTICS_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [getRequiredConfig(config, "rabbitmq.url")],
            queue: config.get<string>("rabbitmq.analyticsQueue") ?? "analytics",
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [ChatController, ChatEventController],
  providers: [
    ChatService,
    ChatGateway,
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
