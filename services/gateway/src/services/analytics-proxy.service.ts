import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';
import { ResultObjectDto } from '../dto/resultobject.dto';

export type AnalyticsType = 'messages' | 'users' | 'general';

@Injectable()
export class AnalyticsProxyService {
  constructor(
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
  ) {}

  getAnalytics(type: AnalyticsType) {
    return this.request<ResultObjectDto<unknown>>('get_analytics', { type });
  }

  private async request<T>(pattern: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(
        this.analyticsClient
          .send<T, unknown>(pattern, payload)
          .pipe(timeout(5000)),
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new ServiceUnavailableException('Analytics service timeout');
      }

      if (error instanceof Error) {
        throw new ServiceUnavailableException(error.message);
      }

      throw new ServiceUnavailableException('Analytics service unavailable');
    }
  }
}
