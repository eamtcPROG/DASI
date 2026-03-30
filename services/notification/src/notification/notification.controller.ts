import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import type { SendEmailDto } from './notification.service';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern('send_email')
  async handleSendEmail(
    @Payload() data: SendEmailDto,
    @Ctx() context: RmqContext,
  ): Promise<{ success: boolean }> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.notificationService.sendEmail(data);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process send_email', error);
      return { success: false };
    } finally {
      channel.ack(originalMsg);
    }
  }
}
