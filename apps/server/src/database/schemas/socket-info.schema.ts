import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { User } from './user.schema';

export type SocketInfoDocument = SocketInfo & Document;

@Schema()
export class SocketInfo {
  /** socket连接id */
  @Prop({ unique: true, index: true, type: String })
  id: string;

  /** 关联用户id */
  @Prop({ ref: () => User, type: User })
  user: any;

  /** ip地址 */
  @Prop()
  ip: string;

  /** 系统 */
  @Prop({ default: '' })
  os: string;

  /** 浏览器 */
  @Prop({ default: '' })
  browser: string;

  /** 详细环境信息 */
  @Prop({ default: '' })
  environment: string;

  /** 创建时间 */
  @Prop({ type: Date, default: Date.now })
  createTime: Date;
}

export const SocketInfoSchema = SchemaFactory.createForClass(SocketInfo);
