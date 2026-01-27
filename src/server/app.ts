import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import imageRouter from '../routes/image-routes.js';
import { loggerOptions } from '../utils/logger.js';
import { setupDashboard } from './queue-dashboard.js';

const app = fastify({ logger: loggerOptions })
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>();

app.register(imageRouter);

setupDashboard(app);

export default app;
