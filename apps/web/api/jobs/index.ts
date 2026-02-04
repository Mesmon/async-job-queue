import type { CreateJobRequest, Job } from "@repo/shared/schemas";
import { apiClient } from "../client";

export const jobsApi = {
  createJob: async (data: CreateJobRequest) => {
    const response = await apiClient.post<Job>("/jobs", data);
    return response.data;
  },

  getJobStatus: async (id: string) => {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  },
};
