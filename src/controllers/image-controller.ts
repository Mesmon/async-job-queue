import type { FastifyReply, FastifyRequest } from 'fastify';
import { jobQueue } from '../queue';

type ProcessImageRequest = FastifyRequest<{
  Body: {
    imageUrl: string;
  };
}>;

export const processImageHandler = async (request: ProcessImageRequest, reply: FastifyReply) => {
  const { imageUrl } = request.body;

  if (!imageUrl) {
    return reply.status(400).send({ error: 'Image URL is required' });
  }

  const job = await jobQueue.add(
    'process-image',
    { imageUrl },
    { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
  );

  return reply.status(202).send({
    status: 'accepted',
    jobId: job.id,
    info: 'Processing started in background',
  });
};
