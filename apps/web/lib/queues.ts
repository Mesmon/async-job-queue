import { Queue } from "bullmq";

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
};

// Singleton pattern for the queue to prevent multiple connections in development
const globalForQueues = global as unknown as {
  imageProcessingQueue: Queue | undefined;
};

export const imageProcessingQueue =
  globalForQueues.imageProcessingQueue ??
  new Queue("image-processing", {
    connection: redisConfig,
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueues.imageProcessingQueue = imageProcessingQueue;
}
