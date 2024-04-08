export interface Context<T> {
  data: T;
  socket: {
    id: string;
    ip: string;
    user: string;
    isAdmin: boolean;
    join: (room: string) => void;
    leave: (room: string) => void;
    emit: (target: string[] | string, event: string, data: any) => void;
  };
}

export interface RouteHandler {
  (ctx: Context<any>): string | any;
}

export type Routes = Record<string, RouteHandler | null>;

export type MiddlewareArgs = Array<any>;

export type MiddlewareNext = () => void;

export interface SendMessageData {
  /** 消息目标 */
  to: string;
  /** 消息类型 */
  type: string;
  /** 消息内容 */
  content: string;
}
