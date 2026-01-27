import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import type { FastifyInstance } from 'fastify';
import { jobQueue } from '../queue';

export const setupDashboard = (app: FastifyInstance) => {
  const serverAdapter = new FastifyAdapter();

  serverAdapter.setBasePath('/ui');

  createBullBoard({
    queues: [new BullMQAdapter(jobQueue)],
    serverAdapter,
  });

  app.register(serverAdapter.registerPlugin(), {
    prefix: '/ui',
  });
};
