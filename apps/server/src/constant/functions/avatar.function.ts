import * as fs from 'fs';

/**
 * 随机获取一个头像文件名
 */
export function randomAvatar(): string {
  const commonPath = require.resolve('@fiora-nest/common');
  // 计算头像数量
  const files = fs.readdirSync(commonPath + '/../avatar');
  const avatarCount = files.length;

  // 随机选择一个头像
  const randomIndex = Math.floor(Math.random() * avatarCount);
  return files[randomIndex];
}
