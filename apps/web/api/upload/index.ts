import type { UploadFileRequest, UploadFileResponse } from "@repo/shared/schemas";
import { apiClient } from "../client";

export const uploadApi = {
  getUploadToken: async (data: UploadFileRequest) => {
    const response = await apiClient.post<UploadFileResponse>("/upload/token", data);
    return response.data;
  },
};
