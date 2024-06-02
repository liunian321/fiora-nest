import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { ObjectUtil } from '../utils/object.util';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (ObjectUtil.checkHasInvalidProperties(value)) {
      throw new Error('参数错误');
    }

    return value;
  }
}
