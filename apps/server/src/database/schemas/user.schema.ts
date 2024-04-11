import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { NAME_OPTION } from '../constant/prop.options';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  /** 用户名 */
  @Prop(NAME_OPTION)
  username: string;

  /** 账号 */
  @Prop({ unique: true })
  accountId: string;

  /**
   * 性别 female: 0, male: 1,secrecy: 2
   */
  @Prop({ default: 2, options: [0, 1, 2], required: false })
  gender?: number;

  /** 盐 */
  @Prop({ select: false })
  salt: string;

  /** 加密后的密码 */
  @Prop({ select: false })
  password: string;

  /** 头像 */
  @Prop()
  avatar: string;

  /** 用户标签 */
  @Prop(Object.assign({}, NAME_OPTION, { default: '', unique: false }))
  tag: string;

  /** 表情收藏 */
  @Prop([String])
  expressions: string[];

  /** 创建时间 */
  @Prop({ default: Date.now })
  createTime: Date;

  /** 最后登录时间 */
  @Prop({ default: Date.now })
  lastLoginTime: Date;

  /** 最后登录IP */
  @Prop()
  lastLoginIp: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
