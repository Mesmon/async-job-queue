import type { Config } from "./types/config";

export const config:Config = {
    redisHost: process.env.REDIS_HOST || "localhost",
    redisPort: Number(process.env.REDIS_PORT) || 6379
}