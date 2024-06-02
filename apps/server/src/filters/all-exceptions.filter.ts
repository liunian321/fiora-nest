import { Error } from 'mongoose';
import { ArgumentsHost, Catch, WsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(Error)
export class AllExceptionsFilter implements WsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // 如果是 WebSocket 请求，则返回 WsException
    if (host.getType() === 'ws') {
      throw new WsException(exception.message);
    }

    throw exception;
  }
}
