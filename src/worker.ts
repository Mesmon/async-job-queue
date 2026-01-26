import { Worker } from 'bullmq';
import { QUEUE_NAME, redisConnection } from './queue';
import { logger } from './utils/logger';

logger.info('Worker started... listening for jobs.');

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    logger.info(`[Job ${job.id}] Processing ${job.data.imageUrl}...`);

    // Simulate heavy processing (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate Random Failure to test Retries!
    if (Math.random() < 0.5) {
      logger.error(`[Job ${job.id}] Failed! (Simulating error)`);
      throw new Error('Random simulated failure');
    }

    logger.info(`[Job ${job.id}] Completed successfully!`);
    return { processed: true, path: '/out/image.png' };
  },
  { connection: redisConnection },
);

// Listen to events
worker.on('completed', (job) => {
  logger.info(`[Job ${job.id}] finished.`);
});

worker.on('failed', (job, err) => {
  logger.error(`[Job ${job?.id}] has failed with ${err.message}`);
});
