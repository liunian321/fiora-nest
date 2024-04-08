import { Socket } from 'socket.io';

/**
 * 获取socket的ip地址
 * @param socket
 */
export function getSocketIp(socket: Socket): string {
  return (
    (socket.handshake.headers['x-real-ip'] as string) ||
    socket.request.socket.remoteAddress ||
    ''
  );
}
