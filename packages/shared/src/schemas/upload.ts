import { z } from "zod";

export const uploadFileRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
});

export const uploadFileResponseSchema = z.object({
  uploadUrl: z.string().url(),
  blobPath: z.string(),
});

export type UploadFileRequest = z.infer<typeof uploadFileRequestSchema>;
export type UploadFileResponse = z.infer<typeof uploadFileResponseSchema>;
