import type { FastifyReply, FastifyRequest } from 'fastify';
import { jobQueue } from '../queue';
import type { ProcessImageRequestBody } from '../types/process-image-request-body';

type ProcessImageRequest = FastifyRequest<{
  Body: ProcessImageRequestBody;
}>;

export const processImageHandler = async (request: ProcessImageRequest, reply: FastifyReply) => {
  const { imageUrl, width, height } = request.body;

  const jobData = { imageUrl, width: width || 800, height: height || 600 };

  if (!imageUrl) {
    return reply.status(400).send({ error: 'Image URL is required' });
  }

  const job = await jobQueue.add('process-image', jobData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 },
  });

  return reply.status(202).send({
    status: 'accepted',
    jobId: job.id,
    jobData,
    info: 'Processing started in background',
  });
};
