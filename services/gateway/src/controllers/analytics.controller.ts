import { Controller, Get, UseGuards } from "@nestjs/common";
import { Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtGuard } from "../auth/jwt.guard";
import {
  AnalyticsProxyService,
  type AnalyticsStats,
} from "../services/analytics-proxy.service";
import { ChatProxyService } from "../services/chat-proxy.service";

type RangeKey = "1m" | "1h" | "1d" | "7d" | "30d";

function getRangeConfig(range: RangeKey): {
  bucketMs: number;
  bucketCount: number;
} {
  if (range === "1m") return { bucketMs: 5_000, bucketCount: 12 };
  if (range === "1h") return { bucketMs: 300_000, bucketCount: 12 };
  if (range === "1d") return { bucketMs: 3_600_000, bucketCount: 24 };
  if (range === "7d") return { bucketMs: 86_400_000, bucketCount: 7 };
  return { bucketMs: 259_200_000, bucketCount: 10 };
}

function getBucketLabel(
  range: RangeKey,
  index: number,
  bucketCount: number,
): string {
  if (range === "1m") return `${(bucketCount - index) * 5}s`;
  if (range === "1h") return `${(bucketCount - index) * 5}m`;
  if (range === "1d") return `${23 - index}h`;
  if (range === "7d") return `D-${6 - index}`;
  return `W-${9 - index}`;
}

function buildBucketsFromMessageTimes(messageTimes: string[], range: RangeKey) {
  const { bucketMs, bucketCount } = getRangeConfig(range);
  const now = Date.now();
  const buckets = Array.from({ length: bucketCount }).map((_, index) => ({
    bucket: getBucketLabel(range, index, bucketCount),
    messages: 0,
    users: 0,
    chats: 0,
  }));

  for (const timestamp of messageTimes) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const elapsed = Math.max(0, now - date.getTime());
    const reverseIndex = Math.floor(elapsed / bucketMs);
    const index = bucketCount - 1 - reverseIndex;
    if (index < 0 || index >= bucketCount) continue;
    buckets[index].messages += 1;
  }

  return buckets;
}

@ApiTags("Analytics")
@ApiBearerAuth("jwt")
@UseGuards(JwtGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsProxy: AnalyticsProxyService,
    private readonly chatProxyService: ChatProxyService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: "Platform analytics (total users, total messages)",
  })
  async getAnalytics(): Promise<{
    totalUsers: number;
    totalMessages: number;
    totalChats: number;
    updatedAt: string;
    lastMessageAt: string | null;
  }> {
    const stats = await this.analyticsProxy.getStats();
    if (!stats) {
      return {
        totalUsers: 0,
        totalMessages: 0,
        totalChats: 0,
        updatedAt: new Date().toISOString(),
        lastMessageAt: null,
      };
    }
    return {
      totalUsers: stats.totalUsers,
      totalMessages: stats.totalMessages,
      totalChats: stats.totalChats ?? 0,
      updatedAt: stats.updatedAt,
      lastMessageAt: stats.lastMessageAt ?? null,
    };
  }

  @Get("activity")
  @ApiOkResponse({
    description: "Range-based activity buckets (messages/users)",
  })
  async getActivity(
    @Query("range") range?: "1m" | "1h" | "1d" | "7d" | "30d",
  ): Promise<
    Array<{ bucket: string; messages: number; users: number; chats: number }>
  > {
    const safeRange = range ?? "1d";
    const points = await this.analyticsProxy.getActivity(safeRange);
    return (points ?? []).map((point) => ({
      bucket: point.bucket,
      messages: point.messages,
      users: point.users,
      chats: point.chats ?? 0,
    }));
  }

  @Get("message-times")
  @ApiOkResponse({ description: "Message timestamps for selected range" })
  async getMessageTimes(
    @Query("range") range?: "1m" | "1h" | "1d" | "7d" | "30d",
  ): Promise<string[]> {
    const safeRange = range ?? "1d";
    return (await this.analyticsProxy.getMessageTimes(safeRange)) ?? [];
  }

  @Get("activity/messages")
  @ApiOkResponse({
    description: "Message activity buckets built from chat DB timestamps",
  })
  async getMessageActivityFromChat(
    @Query("range") range?: RangeKey,
  ): Promise<
    Array<{ bucket: string; messages: number; users: number; chats: number }>
  > {
    const safeRange: RangeKey = range ?? "1d";
    const response = await this.chatProxyService.getChat("message_times");
    const messageTimes = Array.isArray(response?.object)
      ? (response.object as unknown[]).filter(
          (value): value is string => typeof value === "string",
        )
      : [];

    return buildBucketsFromMessageTimes(messageTimes, safeRange);
  }
}
