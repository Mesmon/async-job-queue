import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';

const connection = new IORedis({
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null,
});

export const QUEUE_NAME = config.queueName;

export const jobQueue = new Queue(QUEUE_NAME, { connection });

export const redisConnection = connection;
