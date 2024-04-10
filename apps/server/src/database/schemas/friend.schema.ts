import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

export type FriendDocument = HydratedDocument<Friend>;

@Schema()
export class Friend {
  /** 源用户id */
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  from: string;

  /** 目标用户id */
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  to: string;

  /** 创建时间 */
  @Prop({ type: Date, default: Date.now })
  createTime: Date;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
