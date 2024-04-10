export function getSealIpKey(ip: string) {
  return `SealIp-${ip}`;
}

export function getSealUserKey(user: string) {
  return `SealUser-${user}`;
}

export function getNewRegisteredUserIpKey(ip: string) {
  // The value of v1 is ip
  // The value of v2 is count number
  return `NewRegisteredUserIpV2-${ip}`;
}

export function getNewUserKey(userId: string) {
  return `NewUser-${userId}`;
}
