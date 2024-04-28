import { Injectable } from '@nestjs/common';
import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Group, GroupDocument } from '../database/schemas';

@Injectable()
export class GroupProvider {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
  ) {}

  async findGroupByCondition(
    filter: FilterQuery<GroupDocument>,
    projection?: ProjectionType<GroupDocument> | null | undefined,
    options?: QueryOptions<GroupDocument> | null | undefined,
  ): Promise<GroupDocument[]> {
    return await this.groupModel.find(filter, projection, options).exec();
  }

  async findOneGroupByCondition(
    filter: FilterQuery<GroupDocument>,
    projection?: ProjectionType<GroupDocument> | null | undefined,
    options?: QueryOptions<GroupDocument> | null | undefined,
  ): Promise<GroupDocument | null> {
    return await this.groupModel.findOne(filter, projection, options).exec();
  }

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
   * 获取默认群组
   */
  async getDefaultGroup(): Promise<GroupDocument | null> {
    return await this.groupModel.findOne({ isDefault: true }).exec();
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
