import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type SocketDocument = Socket & Document;

@Schema()
export class Socket {
  /** socket连接id */
  @Prop({ unique: true, index: true })
  id: string;

  /** 关联用户id */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: string;

  /** ip地址 */
  @Prop({ type: String, default: '' })
  ip: string;

  /** 系统 */
  @Prop({ type: String, default: '' })
  os: string;

  /** 浏览器 */
  @Prop({ type: String, default: '' })
  browser: string;

  /** 详细环境信息 */
  @Prop({ type: String, default: '' })
  environment: string;

  /** 创建时间 */
  @Prop({ default: Date.now })
  createTime: Date;

  /** 更新时间 */
  @Prop()
  updateTime: Date;
}

export const SocketSchema = SchemaFactory.createForClass(Socket);
