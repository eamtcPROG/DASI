import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnalyticsEventDocument = HydratedDocument<AnalyticsEvent>;

@Schema({ collection: 'analytics_events' })
export class AnalyticsEvent {
  @Prop({
    type: String,
    required: true,
    enum: ['user.created', 'message.created', 'room.created'],
  })
  type!: 'user.created' | 'message.created' | 'room.created';

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt!: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

