import { z } from "zod";

export const JobStatus = z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]);

export const processingOptionsSchema = z.object({
  type: z.enum(["GRAYSCALE", "BLUR", "RESIZE"]),
  watermark_text: z.string().optional(),
});

export const createJobRequestSchema = z.object({
  processingOptions: processingOptionsSchema.optional(),
  inputPath: z.string().min(1, "Image path is required"),
});

export const jobSchema = z.object({
  id: z.string().uuid(),
  processingOptions: processingOptionsSchema.nullable().optional(),
  status: JobStatus,
  inputPath: z.string(),
  outputPath: z.string().nullable(),
  createdAt: z.date(),
  error: z.string().nullable().optional(),
});

export type CreateJobRequest = z.infer<typeof createJobRequestSchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobStatus = z.infer<typeof JobStatus>;
export type ProcessingOptions = z.infer<typeof processingOptionsSchema>;
