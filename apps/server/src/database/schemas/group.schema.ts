import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { NAME_OPTION } from '../constant/prop.option';

export type GroupDocument = Group & Document;

@Schema()
export class Group {
  /** 群组名 */
  @Prop(NAME_OPTION)
  name: string;

  /** 头像 */
  @Prop()
  avatar: string;

  /** 公告 */
  @Prop({ default: '' })
  announcement: string;

  /** 创建者 */
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  creator: string;

  /** 是否为默认群组 */
  @Prop()
  isDefault: boolean;

  /** 成员 */
  @Prop([String])
  memberIds: string[];

  /** 创建时间 */
  @Prop({ default: Date.now })
  createTime: Date;

  /** 更新时间 */
  @Prop()
  updateTime: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
