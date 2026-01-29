export type Config = {
  port: number;
  logLevel: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  queueName: string;
};
