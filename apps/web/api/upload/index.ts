import type { UploadFileRequest, UploadFileResponse } from "@repo/shared/schemas";
import { apiClient } from "../client";

export const uploadApi = {
  getUploadToken: (data: UploadFileRequest) =>
    apiClient.post<UploadFileResponse>("/upload/token", data),
};
