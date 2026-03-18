import { Controller } from "@nestjs/common";
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from "@nestjs/microservices";
import { AnalyticsService } from "../services/analytics.service";
import { ResultObjectDto } from "../dto/resultobject.dto";

@Controller()
export class AnalyticsEventController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern("get_analytics")
  async handleGetAnalytics(
    @Payload() data: { type: "messages" | "users" | "general" },
    @Ctx() context: RmqContext,
  ): Promise<ResultObjectDto<unknown>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    let analytics: unknown;

    switch (data.type) {
      case "messages":
        analytics = await this.analyticsService.getMessageAnalytics();
        break;
      case "users":
        analytics = await this.analyticsService.getUserAnalytics();
        break;
      case "general":
        analytics = await this.analyticsService.getGeneralAnalytics();
        break;
      default:
        return new ResultObjectDto(null, true, 400, [
          { type: 2, message: "Invalid analytics type" },
        ]);
    }

    channel.ack(originalMsg);
    return new ResultObjectDto(analytics, false, 200);
  }
}
