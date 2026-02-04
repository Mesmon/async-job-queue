import { apiClient } from "../client";
import type { UploadFileRequest, UploadFileResponse } from "@repo/shared/schemas";

export const uploadApi = {
  getUploadToken: (data: UploadFileRequest) => 
    apiClient.post<UploadFileResponse>("/upload/token", data),
};
