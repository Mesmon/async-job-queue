import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { jobQueue } from '../queue';

export const getServerAdapter = () => {
  const serverAdapter = new FastifyAdapter();

  serverAdapter.setBasePath('/ui');

  createBullBoard({
    queues: [new BullMQAdapter(jobQueue)],
    serverAdapter,
  });

  return serverAdapter;
};
