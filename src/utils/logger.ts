import pino from 'pino';
import { config } from '../config.js';

const level = config.logLevel || 'info';

export const loggerOptions = {
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
};

export const logger = pino(loggerOptions);
