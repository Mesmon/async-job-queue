import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import imageRouter from '../routes/image-routes.js';
import { logger } from '../utils/logger.js';
import { getServerAdapter } from './queue-dashboard.js';

const app = fastify({ loggerInstance: logger })
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>();

app.register(imageRouter);

app.register(getServerAdapter().registerPlugin(), {
  prefix: '/ui',
});

export default app;
