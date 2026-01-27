import type { FastifyInstance } from 'fastify';
import { processImageHandler } from '../controllers/image-controller';
import { processImageRouteSchema } from '../schemas/process-image-request';

const imageRouter = async (app: FastifyInstance) => {
  app.post('/process-image', { schema: processImageRouteSchema }, processImageHandler);
};

export default imageRouter;
