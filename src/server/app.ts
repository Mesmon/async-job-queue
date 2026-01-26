import fastify from 'fastify';
import imageRouter from '../routes/image-routes.js';
import { loggerOptions } from '../utils/logger.js';

const app = fastify({
  logger: loggerOptions,
});

app.register(imageRouter);

export default app;
