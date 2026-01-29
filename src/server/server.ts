import { config } from '../config/config.js';
import { jobQueue, redisConnection } from '../queue.js';
import { logger } from '../utils/logger.js';
import app from './app.js';

let isShuttingDown = false;

export const startServer = async () => {
  try {
    registerShutdownSignals();

    const { port } = config;
    await app.listen({ host: '0.0.0.0', port });
    logger.info(`Server listening on port ${port}`);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
};

const registerShutdownSignals = () => {
  const signals = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.once(signal, () => closeServer(signal));
  }
};

export const closeServer = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Safety Timeout
  // If resources don't close in 10s, force kill the process to prevent hanging
  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out, forcefully exiting');
    process.exit(1);
  }, 10000);

  try {
    await app.close();
    logger.info('HTTP server closed');

    await jobQueue.close();
    logger.info('Job Queue closed');

    await redisConnection.quit();
    logger.info('Redis connection closed');

    clearTimeout(forceExit); // Cancel the kill switch
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during graceful shutdown');
    process.exit(1);
  }
};
