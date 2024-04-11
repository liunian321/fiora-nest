import { PropOptions } from '@nestjs/mongoose';

import { NAME_REGEXP } from '../../constant/base.constant';

export const NAME_OPTION: PropOptions = {
  required: true,
  trim: true,
  unique: true,
  match: NAME_REGEXP,
  index: true,
};
