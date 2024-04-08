export interface Group extends Document {
  /** 群组名 */
  name: string;
  /** 头像 */
  avatar: string;
  /** 公告 */
  announcement: string;
  /** 创建者 */
  creator: string;
  /** 是否为默认群组 */
  isDefault: boolean;
  /** 成员 */
  memberIds: string[];
  /** 创建时间 */
  createTime: Date;
  /** 更新时间 */
  updateTime: Date;
}
