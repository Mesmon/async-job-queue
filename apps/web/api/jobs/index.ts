import type { CreateJobRequest, Job } from "@repo/shared/schemas";
import { apiClient } from "../client";

export const jobsApi = {
  createJob: (data: CreateJobRequest) => apiClient.post<Job>("/jobs", data),

  getJobStatus: (id: string) => apiClient.get<Job>(`/jobs/${id}`),
};
