import { logger } from '../utils/logger';
import { closeServer } from './server';

export const shutdown = async (): Promise<void> => {
  try {
    logger.info('Starting shutdown');
    await closeServer();
    logger.info('Successfully finished shutdown');
    process.exit(1);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};
