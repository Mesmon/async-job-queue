import type z from 'zod';
import type { processImageRequestSchemas } from '../schemas/process-image-request';

export type ProcessImageRequestBody = z.infer<typeof processImageRequestSchemas.body>;
