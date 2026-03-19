import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnalyticsSnapshotDocument = HydratedDocument<AnalyticsSnapshot>;

@Schema({ collection: 'analytics_snapshot' })
export class AnalyticsSnapshot {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: Number, required: true, default: 0 })
  totalUsers!: number;

  @Prop({ type: Number, required: true, default: 0 })
  totalMessages!: number;

  @Prop({ type: Number, required: true, default: 0 })
  totalChats!: number;

  @Prop({ type: Date, required: true, default: () => new Date() })
  updatedAt!: Date;
}

export const AnalyticsSnapshotSchema =
  SchemaFactory.createForClass(AnalyticsSnapshot);

