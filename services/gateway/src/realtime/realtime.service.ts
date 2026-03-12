import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RealtimeService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<number>('redis.port');

    return {
      enabled: false,
      socketConnectionsManaged: false,
      redisConfigured: Boolean(redisHost && redisPort),
    };
  }
}
