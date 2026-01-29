import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

const connection = new IORedis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,
  maxRetriesPerRequest: null,

  // SSL/TLS Logic
  tls:
    config.redisPort === 6380
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

connection.on('error', (err) => {
  logger.error(err, '❌ Redis connection error');
});

connection.on('connect', () => {
  logger.info('✅ Connected to Redis successfully!');
});

export const QUEUE_NAME = config.queueName;
export const jobQueue = new Queue(QUEUE_NAME, { connection });
export const redisConnection = connection;
