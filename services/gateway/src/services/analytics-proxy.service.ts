import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type AnalyticsStats = {
  totalUsers: number;
  totalMessages: number;
  totalChats?: number;
  updatedAt: string;
  lastMessageAt?: string | null;
};

export type AnalyticsActivityPoint = {
  bucket: string;
  messages: number;
  users: number;
  chats?: number;
};

@Injectable()
export class AnalyticsProxyService {
  constructor(private readonly config: ConfigService) {}

  async getStats(): Promise<AnalyticsStats | null> {
    const baseUrl = this.config.get<string>("analytics.baseUrl");
    if (!baseUrl) return null;
    const url = `${baseUrl.replace(/\/$/, "")}/stats`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as AnalyticsStats;
    } catch {
      return null;
    }
  }

  async getActivity(
    range: "1m" | "1h" | "1d" | "7d" | "30d",
  ): Promise<AnalyticsActivityPoint[] | null> {
    const baseUrl = this.config.get<string>("analytics.baseUrl");
    if (!baseUrl) return null;
    const url = `${baseUrl.replace(/\/$/, "")}/stats/activity?range=${range}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as AnalyticsActivityPoint[];
    } catch {
      return null;
    }
  }

  async getMessageTimes(
    range: "1m" | "1h" | "1d" | "7d" | "30d",
  ): Promise<string[] | null> {
    const baseUrl = this.config.get<string>("analytics.baseUrl");
    if (!baseUrl) return null;
    const url = `${baseUrl.replace(/\/$/, "")}/stats/message-times?range=${range}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as string[];
    } catch {
      return null;
    }
  }
}
