import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "@/api/jobs";

export function useJobStatus(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job?.status === "COMPLETED" || job?.status === "FAILED") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}
