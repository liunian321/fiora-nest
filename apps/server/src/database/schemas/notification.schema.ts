import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema()
export class Notification {
  // 创建时间
  @Prop({ type: Date, default: Date.now })
  createTime: Date;

  // 用户
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
