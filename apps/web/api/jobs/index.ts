import { apiClient } from "../client";
import type { CreateJobRequest, Job } from "@repo/shared/schemas";

export const jobsApi = {
  createJob: (data: CreateJobRequest) => 
    apiClient.post<Job>("/jobs", data),
    
  getJobStatus: (id: string) => 
    apiClient.get<Job>(`/jobs/${id}`),
};
