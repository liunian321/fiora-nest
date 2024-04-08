import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Group } from './interfaces/group.interface';

@Injectable()
export class GroupService {
  constructor(
    @Inject('GROUP_MODEL')
    private readonly groupModel: Model<Group>,
  ) {}
}
