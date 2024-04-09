import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Group } from '../database/schemas/group.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class GroupProvider {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
  ) {}

  /**
   * 创建群组
   * @param group
   */
  async createGroup(group: Group): Promise<Group> {
    return await this.groupModel.create(group);
  }

  /**
   * 获取所有群组
   */
  async getAllGroups(): Promise<Group[]> {
    return await this.groupModel.find().exec();
  }

  /**
   * 通过ID获取群组
   * @param id
   */
  async getGroupById(id: string): Promise<Group> {
    return await this.groupModel.findOne({ _id: id }).exec();
  }

  /**
   * 更新群组
   * @param id
   * @param group
   */
  async updateGroup(id: string, group: Partial<Group>): Promise<Group> {
    return await this.groupModel
      .findByIdAndUpdate(id, group, { new: true })
      .exec();
  }

  /**
   * 删除群组
   * @param id
   */
  async deleteGroup(id: string): Promise<Group> {
    return await this.groupModel.findOneAndDelete({ _id: id }).exec();
  }
}
