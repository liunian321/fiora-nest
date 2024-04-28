export const NAME_REGEXP =
  /^([0-9a-zA-Z]{1,2}|[\u4e00-\u9eff]|[\u3040-\u309Fー]|[\u30A0-\u30FF]){1,8}$/;

/** 一天时间 */
export const ONE_DAY = 1000 * 60 * 60 * 24;

/** 一年时间 */
export const OneYear = 365 * 24 * 3600 * 1000;

/** 石头剪刀布, 用于随机生成结果 */
export const RPS = ['石头', '剪刀', '布'];

/**
 * 项目名称
 */
export const PROJECT_NAME = 'fiora-nest';

export const DisableSendMessageKey = PROJECT_NAME + 'DisableSendMessage';

export const DisableNewUserSendMessageKey =
  PROJECT_NAME + 'DisableNewUserSendMessageKey';
