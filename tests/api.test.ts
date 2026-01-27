import { beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../src/server/app';

// mock the queue
vi.mock('../src/queue', () => ({
  jobQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-123' }), // Simulate success
  },
}));

describe('POST /process-image', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should accept a valid image request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/process-image',
      payload: {
        imageUrl: 'https://example.com/image.jpg',
        width: 100,
        height: 100,
      },
    });

    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('accepted');
    expect(body.jobId).toBe('mock-job-123');
    expect(body.jobData).toEqual({
      imageUrl: 'https://example.com/image.jpg',
      width: 100,
      height: 100,
    });
    expect(body.info).toBe('Processing started in background');
  });

  it('should reject invalid input (missing URL)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/process-image',
      payload: {
        width: 100,
      },
    });

    // Fastify schema validation handles this automatically
    expect(response.statusCode).toBe(400);
  });
});
