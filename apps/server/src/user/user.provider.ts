import { Injectable } from '@nestjs/common';
import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as mongodb from 'mongodb';

import { User } from '../database/schemas';

@Injectable()
export class UserProvider {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(user: User) {
    return await this.userModel.create(user);
  }

  /**
   * 根据ID删除用户
   * @param id
   */
  async deleteUser(id: string): Promise<mongodb.DeleteResult> {
    return await this.userModel.deleteOne({ _id: id }).exec();
  }

  async updateUser(filter: FilterQuery<User>, update: Partial<User>) {
    return await this.userModel.updateOne(filter, update).exec();
  }

  async findOneUserByCondition(
    filter?: FilterQuery<User>,
    projection?: ProjectionType<User>,
    options?: QueryOptions<User>,
  ) {
    return await this.userModel.findOne(filter, projection, options).exec();
  }

  async findUserByCondition(
    filter?: FilterQuery<User>,
    projection?: ProjectionType<User>,
    options?: QueryOptions<User>,
  ) {
    return await this.userModel.find(filter, projection, options).exec();
  }

  async getUserById(id: string) {
    return await this.userModel
      .findOne({
        _id: id,
      })
      .exec();
  }
}
