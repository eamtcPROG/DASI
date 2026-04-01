import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { TimeoutError, firstValueFrom, timeout } from "rxjs";

export type AnalyticsEventName =
  | "user.created"
  | "message.created"
  | "room.created";

@Injectable()
export class AnalyticsEventsService {
  constructor(
    @Inject("ANALYTICS_EVENTS") private readonly analyticsClient: ClientProxy,
  ) {}

  async publish(event: AnalyticsEventName, data?: Record<string, unknown>) {
    try {
      await firstValueFrom(
        this.analyticsClient
          .emit("analytics.event", { event, data })
          .pipe(timeout(2000)),
      );
    } catch (error) {
      // Best-effort: analytics must not break  the main flow.
      if (error instanceof TimeoutError) return;
      return;
    }
  }
}
