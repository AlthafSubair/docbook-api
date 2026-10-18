import { Logger } from '@nestjs/common';

const logger = new Logger('Configuration');

export default () => {
  const environment = process.env.NODE_ENV ?? 'development';

  logger.log(`Environment: ${environment}`);
  logger.log('Environment configuration loaded');

  return {
    port: Number(process.env.PORT ?? 3000),
  };
};