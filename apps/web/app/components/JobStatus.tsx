"use client";

import type { Job } from "@repo/shared/schemas";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function JobStatus({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:3000/jobs/${jobId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch job status");
        }
        const data = await res.json();
        setJob(data);

        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(intervalId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        clearInterval(intervalId);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 2000);

    return () => clearInterval(intervalId);
  }, [jobId]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <p className="font-medium">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading status...</span>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> Queued
          </Badge>
        );
    }
  };

  return (
    <Card className="shadow-md border-t-4 border-t-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">Job Status</CardTitle>
        {getStatusBadge(job.status)}
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Job ID</p>
            <p className="font-mono text-xs truncate">{job.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created At</p>
            <p>{new Date(job.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Prompt</p>
          <p className="text-sm bg-muted p-2 rounded-md italic">"{job.prompt}"</p>
        </div>

        {job.outputImagePath && (
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Output Preview</p>
            <div className="rounded-lg overflow-hidden border">
              <img
                src={job.outputImagePath}
                alt="Job Output"
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>
          </div>
        )}

        {job.error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-100 text-red-700 text-sm">
            <strong>Error:</strong> {job.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
