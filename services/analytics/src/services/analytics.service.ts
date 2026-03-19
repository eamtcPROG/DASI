import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnalyticsSnapshot,
  AnalyticsSnapshotDocument,
} from '../schemas/analytics-snapshot.schema';
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from '../schemas/analytics-event.schema';

const SNAPSHOT_ID = 'snapshot';
type RangeKey = '1m' | '1h' | '1d' | '7d' | '30d';
const MAX_FUTURE_SKEW_MS = 5_000;

@Injectable()
export class AnalyticsService implements OnModuleInit {
  constructor(
    @InjectModel(AnalyticsSnapshot.name)
    private readonly snapshotModel: Model<AnalyticsSnapshotDocument>,
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.snapshotModel.updateOne(
      { _id: SNAPSHOT_ID },
      {
        $setOnInsert: {
          _id: SNAPSHOT_ID,
          totalUsers: 0,
          totalMessages: 0,
          totalChats: 0,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalMessages: number;
    totalChats: number;
    updatedAt: string;
    lastMessageAt: string | null;
  }> {
    const doc = await this.snapshotModel
      .findById(SNAPSHOT_ID)
      .select({ totalUsers: 1, totalMessages: 1, totalChats: 1, updatedAt: 1 })
      .lean();
    const latestMessageEvent = await this.eventModel
      .findOne({ type: 'message.created' })
      .sort({ createdAt: -1 })
      .select({ createdAt: 1 })
      .lean();

    if (!doc) {
      return {
        totalUsers: 0,
        totalMessages: 0,
        totalChats: 0,
        updatedAt: new Date().toISOString(),
        lastMessageAt: null,
      };
    }
    return {
      totalUsers: Number(doc.totalUsers) || 0,
      totalMessages: Number(doc.totalMessages) || 0,
      totalChats: Number(doc.totalChats) || 0,
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt.toISOString()
          : new Date(doc.updatedAt).toISOString(),
      lastMessageAt: latestMessageEvent?.createdAt
        ? new Date(latestMessageEvent.createdAt).toISOString()
        : null,
    };
  }

  async recordEvent(
    type: 'user.created' | 'message.created' | 'room.created',
    occurredAt?: string | Date,
  ): Promise<void> {
    const now = new Date();
    const parsed =
      occurredAt instanceof Date ? occurredAt : occurredAt ? new Date(occurredAt) : new Date();
    const isInvalid = Number.isNaN(parsed.getTime());
    const isTooFarInFuture = parsed.getTime() - now.getTime() > MAX_FUTURE_SKEW_MS;
    const createdAt = isInvalid || isTooFarInFuture ? now : parsed;
    await this.eventModel.create({ type, createdAt });
  }

  async getActivity(range: RangeKey): Promise<
    Array<{ bucket: string; messages: number; users: number; chats: number }>
  > {
    const config = this.getRangeConfig(range);
    const now = Date.now();
    const start = new Date(now - config.windowMs);

    const events = await this.eventModel
      .find({ createdAt: { $gte: start } })
      .select({ type: 1, createdAt: 1 })
      .lean();

    const buckets = Array.from({ length: config.bucketCount }, (_, index) => ({
      bucket: this.getBucketLabel(range, index, config.bucketCount),
      messages: 0,
      users: 0,
      chats: 0,
    }));

    for (const event of events) {
      const createdAtMs = new Date(event.createdAt).getTime();
      const elapsed = Math.max(0, now - createdAtMs);
      const reverseIndex = Math.floor(elapsed / config.bucketMs);
      const index = config.bucketCount - 1 - reverseIndex;
      if (index < 0 || index >= buckets.length) continue;

      if (event.type === 'message.created') {
        buckets[index].messages += 1;
      } else if (event.type === 'user.created') {
        buckets[index].users += 1;
      } else if (event.type === 'room.created') {
        buckets[index].chats += 1;
      }
    }

    return buckets;
  }

  async getMessageTimes(range: RangeKey): Promise<string[]> {
    const config = this.getRangeConfig(range);
    const start = new Date(Date.now() - config.windowMs);
    const events = await this.eventModel
      .find({ type: 'message.created', createdAt: { $gte: start } })
      .sort({ createdAt: 1 })
      .select({ createdAt: 1 })
      .lean();

    return events
      .map((event) => {
        const date = new Date(event.createdAt);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      })
      .filter((value): value is string => value !== null);
  }

  async incrementUsers(): Promise<void> {
    await this.snapshotModel.updateOne(
      { _id: SNAPSHOT_ID },
      { $inc: { totalUsers: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true },
    );
  }

  async incrementMessages(): Promise<void> {
    await this.snapshotModel.updateOne(
      { _id: SNAPSHOT_ID },
      { $inc: { totalMessages: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true },
    );
  }

  async incrementChats(): Promise<void> {
    await this.snapshotModel.updateOne(
      { _id: SNAPSHOT_ID },
      { $inc: { totalChats: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true },
    );
  }

  private getRangeConfig(range: RangeKey): {
    windowMs: number;
    bucketMs: number;
    bucketCount: number;
  } {
    if (range === '1m') return { windowMs: 60_000, bucketMs: 5_000, bucketCount: 12 };
    if (range === '1h')
      return { windowMs: 3_600_000, bucketMs: 300_000, bucketCount: 12 };
    if (range === '1d')
      return { windowMs: 86_400_000, bucketMs: 3_600_000, bucketCount: 24 };
    if (range === '7d')
      return { windowMs: 604_800_000, bucketMs: 86_400_000, bucketCount: 7 };
    return { windowMs: 2_592_000_000, bucketMs: 259_200_000, bucketCount: 10 };
  }

  private getBucketLabel(
    range: RangeKey,
    index: number,
    bucketCount: number,
  ): string {
    if (range === '1m') return `${(bucketCount - index) * 5}s`;
    if (range === '1h') return `${(bucketCount - index) * 5}m`;
    if (range === '1d') return `${23 - index}h`;
    if (range === '7d') return `D-${6 - index}`;
    return `W-${9 - index}`;
  }
}
