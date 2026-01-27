import fs from 'node:fs/promises';
import path from 'node:path';
import { Worker } from 'bullmq';
import sharp from 'sharp';
import { QUEUE_NAME, redisConnection } from './queue';
import { logger } from './utils/logger';

logger.info('Worker started... listening for jobs.');

// Ensure output directory exists
const OUT_DIR = path.join(process.cwd(), 'out');
await fs.mkdir(OUT_DIR, { recursive: true });

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { imageUrl, width, height } = job.data;
    logger.info(`[Job ${job.id}] Processing ${imageUrl} -> ${width}x${height}`);

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const processedBuffer = await sharp(buffer)
        .resize(width, height)
        .grayscale() // Make it black & white for demonstration
        .toFormat('png')
        .toBuffer();

      // Simulate Random Failure to test Retries
      if (Math.random() < 0.5) {
        logger.error(`[Job ${job.id}] Failed! (Simulating error)`);
        throw new Error('Random simulated failure');
      }

      const fileName = `processed-${job.id}.png`;
      const filePath = path.join(OUT_DIR, fileName);
      await fs.writeFile(filePath, processedBuffer);

      logger.info(`[Job ${job.id}] Saved to ${filePath}`);
      return { processed: true, filePath };
    } catch (error) {
      logger.error(error);
      throw error; // Rethrow to trigger BullMQ retry logic
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one job at a time
  },
);

worker.on('failed', (job, err) => {
  logger.error(`[Job ${job?.id}] has failed with ${err.message}`);
});
