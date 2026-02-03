import {z} from 'zod';

export const jobStatus = z.enum(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']);

export const createJobRequestSchema = z.object({
    prompt: z.string().min(3, "Prompt must be at least 3 characters long").max(500, "Prompt must be at most 500 characters long"),
    inputImagePath: z.string().min(1, "Image path is required"),
});

export const jobSchema = z.object({
    id: z.uuid(),
    status: jobStatus,
    prompt: z.string(),
    inputImagePath: z.string(),
    outputImagePath: z.string().nullable(),
    createdAt: z.date(),
    error: z.string().nullable().optional(),
});

export type CreateJobRequest = z.infer<typeof createJobRequestSchema>;
export type Job = z.infer<typeof jobSchema>;

