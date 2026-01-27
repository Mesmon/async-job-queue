import z from 'zod';

export const bodySchema = z.object({
  imageUrl: z.url(),
  width: z.number().min(10).max(2000).optional(),
  height: z.number().min(10).max(2000).optional(),
});
