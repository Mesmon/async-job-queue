import pino from 'pino';
import { config } from '../config.js';

const level = config.logLevel || 'info';

const loggerOptions = {
  level,
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { destination: './app.log', mkdir: true },
      },
      {
        target: 'pino-pretty',
        level,
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
    ],
  },
};

export const logger = pino(loggerOptions);
