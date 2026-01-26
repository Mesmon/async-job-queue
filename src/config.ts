import type { Config } from "./types/config";

export const config: Config = {
	port: Number(process.env.PORT) || 3000,
    logLevel: process.env.LOG_LEVEL || "info",
	redisHost: process.env.REDIS_HOST || "localhost",
	redisPort: Number(process.env.REDIS_PORT) || 6379,
	queueName: process.env.QUEUE_NAME || "job-queue",
};
