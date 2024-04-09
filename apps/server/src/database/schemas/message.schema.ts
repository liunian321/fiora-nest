import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {
  /** 发送人 */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  from: string;

  /** 接受者, 发送给群时为群_id, 发送给个人时为俩人的_id按大小序拼接后值 */
  @Prop({ type: String, index: true })
  to: string;

  /** 类型, text: 文本消息, image: 图片消息, code: 代码消息, invite: 邀请加群消息, system: 系统消息 */
  @Prop({
    enum: ['text', 'image', 'file', 'code', 'inviteV2', 'system'],
    default: 'text',
  })
  type: string;

  /** 内容, 某些消息类型会存成JSON */
  @Prop({ type: String, default: '' })
  content: string;

  /** 创建时间 */
  @Prop({ type: Date, default: Date.now })
  createTime: Date;

  /** 消息是否已经删除 */
  @Prop({ type: Boolean, default: false })
  deleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
