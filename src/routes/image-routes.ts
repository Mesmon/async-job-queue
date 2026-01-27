import type { FastifyInstance } from 'fastify';
import { processImageHandler } from '../controllers/image-controller';
import { processImageRequestSchemas } from '../schemas/process-image-request';

const processImage = async (fastify: FastifyInstance) => {
  fastify.post(
    '/process-image',
    {
      schema: {
        body: processImageRequestSchemas.body,
        response: {
          202: processImageRequestSchemas[202],
          400: processImageRequestSchemas[400],
        },
        tags: ['Images'],
      },
    },
    processImageHandler,
  );
};

const imageRouter = async (fastify: FastifyInstance) => {
  await processImage(fastify);
};

export default imageRouter;
