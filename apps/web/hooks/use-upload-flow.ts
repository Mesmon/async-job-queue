import type { Job } from "@repo/shared/schemas";
import { useMutation } from "@tanstack/react-query";
import { blobClient } from "@/api/client";
import { jobsApi } from "@/api/jobs";
import { uploadApi } from "@/api/upload";

interface UploadFlowParams {
  file: File;
  prompt: string;
}

export function useUploadFlow() {
  const mutation = useMutation({
    mutationFn: async ({ file, prompt }: UploadFlowParams): Promise<Job> => {
      // Step 1: Get SAS Token
      const { uploadUrl, blobPath } = await uploadApi.getUploadToken({
        filename: file.name,
      });

      // Step 2: Direct Upload to Azure
      await blobClient.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      // Step 3: Create Job in API
      return jobsApi.createJob({
        prompt,
        inputImagePath: blobPath,
      });
    },
  });

  return {
    upload: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
