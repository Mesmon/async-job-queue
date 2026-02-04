import { z } from "zod";

export const uploadFileRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
});

export type UploadFileRequest = z.infer<typeof uploadFileRequestSchema>;
