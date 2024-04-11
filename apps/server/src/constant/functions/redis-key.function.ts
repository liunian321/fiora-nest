/**
 * 获取封禁IP的key
 * @param ip
 */
export function getSealIpKey(ip: string) {
  return `SealIp-${ip}`;
}

/**
 * 获取封禁用户的key
 * @param user
 */
export function getSealUserKey(user: string) {
  return `SealUser-${user}`;
}

/**
 * 获取新注册用户的ip key
 * @param ip
 */
export function getNewRegisteredUserIpKey(ip: string) {
  // The value of v1 is ip
  // The value of v2 is count number
  return `NewRegisteredUserIpV2-${ip}`;
}

/**
 * 获取新用户的key
 * @param userId
 */
export function getNewUserKey(userId: string) {
  return `NewUser-${userId}`;
}
