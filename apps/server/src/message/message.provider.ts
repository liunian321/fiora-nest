import { Injectable } from '@nestjs/common';
import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Message } from '../database/schemas';

@Injectable()
export class MessageProvider {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  /**
   * 谨慎调用此方法进行跨模块操作!
   */
  async getMessageModel(): Promise<Model<Message>> {
    return this.messageModel;
  }

  /**
   * 创建消息
   * @param message
   */
  async createMessage(message: Message): Promise<Message> {
    return await this.messageModel.create(message);
  }

  /**
   * 获取所有消息
   */
  async getAllMessages(
    filter: FilterQuery<Message>,
    projection?: ProjectionType<Message> | null | undefined,
    options?: QueryOptions<Message> | null | undefined,
  ): Promise<Message[]> {
    return await this.messageModel.find(filter, projection, options).exec();
  }

  /**
   * 通过ID获取消息
   * @param id
   */
  async getMessageById(id: string): Promise<Message> {
    return await this.messageModel.findOne({ _id: id }).exec();
  }

  /**
   * 更新消息
   * @param id
   * @param message
   */
  async updateMessage(id: string, message: Partial<Message>): Promise<Message> {
    return await this.messageModel
      .findByIdAndUpdate(id, message, { new: true })
      .exec();
  }

  /**
   * 删除消息
   * @param id
   */
  async deleteMessage(id: string): Promise<Message> {
    return await this.messageModel.findOneAndDelete({ _id: id }).exec();
  }
}
