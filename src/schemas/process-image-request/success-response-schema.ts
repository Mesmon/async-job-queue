import z from 'zod';
import { bodySchema } from './body-schema';

export const successResponseSchema = z.object({
  status: z.string(),
  jobId: z.string(),
  jobData: bodySchema,
  info: z.string(),
});
