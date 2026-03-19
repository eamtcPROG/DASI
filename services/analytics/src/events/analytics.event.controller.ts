import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { AnalyticsService } from '../services/analytics.service';

type AnalyticsEventPayload = {
  event: 'user.created' | 'message.created' | 'room.created';
  data?: Record<string, unknown>;
};

type RmqChannel = { ack: (msg: unknown) => void };

@Controller()
export class AnalyticsEventController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern('analytics.event')
  async handleEvent(
    @Payload() payload: AnalyticsEventPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RmqChannel;
    const message = context.getMessage();

    try {
      const occurredAt =
        typeof payload.data?.occurredAt === 'string'
          ? payload.data.occurredAt
          : typeof payload.data?.createdAt === 'string'
            ? payload.data.createdAt
          : undefined;

      if (payload.event === 'user.created') {
        await this.analyticsService.recordEvent('user.created', occurredAt);
        await this.analyticsService.incrementUsers();
      } else if (payload.event === 'message.created') {
        await this.analyticsService.recordEvent('message.created', occurredAt);
        await this.analyticsService.incrementMessages();
      } else if (payload.event === 'room.created') {
        await this.analyticsService.recordEvent('room.created', occurredAt);
        await this.analyticsService.incrementChats();
      }
    } finally {
      channel.ack(message);
    }
  }
}
