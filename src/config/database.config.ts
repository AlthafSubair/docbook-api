
import { registerAs } from '@nestjs/config';
import { getDatabaseOptions } from './database.options.js';

export default registerAs('database', () => ({
  ...getDatabaseOptions(),
  autoLoadEntities: true,
  synchronize: false,
}));
