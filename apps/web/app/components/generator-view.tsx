"use client";

import { CheckCircle2, Image as ImageIcon, Loader2, Send, Upload, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useJobStatus } from "@/hooks/use-job-status";
import { useUploadFlow } from "@/hooks/use-upload-flow";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

export function GeneratorView() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { upload, isPending: isUploading, error: uploadError } = useUploadFlow();

  const {
    data: job,
    isLoading: isPolling, // Used to show initial loader before data arrives
    error: pollError,
  } = useJobStatus(activeJobId ?? undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !prompt) {
      return;
    }
    try {
      const jobResponse = await upload({ file, prompt });
      setActiveJobId(jobResponse.id);
      setFile(null);
      setPrompt("");
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  // Determine if we are in a "working" state
  const isProcessing = job?.status === "QUEUED" || job?.status === "PROCESSING";

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Upload Card */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" />
            AI Image Transformer
          </CardTitle>
          <CardDescription>
            Upload your base image and describe the transformation you want.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="baseImage" className="text-sm font-semibold text-foreground/80">
              Base Image
            </label>
            <div className="relative group">
              <Input
                id="baseImage"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 z-10 h-full w-full opacity-0 cursor-pointer"
              />
              <div className="flex h-12 w-full items-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-4 py-2 transition-all group-hover:border-primary/50 group-hover:bg-muted/50">
                <Upload className="mr-3 h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {file ? file.name : "Click or drag to select an image..."}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-semibold text-foreground/80">
              Transformation Prompt
            </label>
            <Input
              id="prompt"
              placeholder="Describe what to do (e.g. 'Make it a cyberpunk landscape')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-12"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !prompt}
            className="w-full h-12 text-base font-bold shadow-md transition-all hover:scale-[1.01]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Upload...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Generate Transformation
              </>
            )}
          </Button>
          {(uploadError || pollError) && (
            <p className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
              <XCircle className="h-4 w-4" />
              {((uploadError || pollError) as Error)?.message || "Something went wrong"}
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Result View - Now handles loading state correctly */}
      {activeJobId && (
        <Card className="animate-in fade-in zoom-in-95 duration-500 border-t-4 border-t-primary shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Job Result</CardTitle>
              <p className="text-xs font-mono text-muted-foreground">{activeJobId}</p>
            </div>

            {/* Status Badge Logic */}
            <div className="flex flex-col items-end gap-2">
              {/* Case 1: Initial Load (Polling) */}
              {!job && isPolling && (
                <Badge variant="outline" className="h-7 px-3 text-sm">
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Connecting...
                </Badge>
              )}

              {/* Case 2: Job Data Loaded */}
              {job?.status === "COMPLETED" && (
                <Badge variant="success" className="h-7 px-3 text-sm">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Finished
                </Badge>
              )}
              {job?.status === "FAILED" && (
                <Badge variant="destructive" className="h-7 px-3 text-sm">
                  <XCircle className="mr-1 h-4 w-4" /> Failed
                </Badge>
              )}
              {isProcessing && (
                <Badge variant="secondary" className="h-7 px-3 text-sm animate-pulse">
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> {job?.status}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Loading State Skeleton */}
            {!job && isPolling ? (
              <div className="h-64 w-full flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/30 rounded-xl animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                <p className="text-sm">Fetching job status...</p>
              </div>
            ) : job ? (
              // Actual Content
              <>
                <div className="bg-muted/50 p-4 rounded-lg border border-primary/5">
                  <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                    Prompt Used
                  </p>
                  <p className="text-foreground italic font-medium leading-relaxed">
                    "{job.prompt}"
                  </p>
                </div>

                <div className="relative rounded-xl overflow-hidden border-4 border-background shadow-2xl bg-muted aspect-video flex items-center justify-center">
                  {job.outputImagePath ? (
                    <Image
                      src={job.outputImagePath}
                      alt="Transformed Result"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : isProcessing ? (
                    <div className="flex flex-col items-center text-muted-foreground gap-3">
                      <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                      <p className="text-sm font-medium animate-pulse">
                        AI is working its magic...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground gap-2">
                      <ImageIcon className="h-12 w-12 opacity-20" />
                      <p className="text-sm">No output generated</p>
                    </div>
                  )}
                </div>

                {job.error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    <strong>Error Details:</strong> {job.error}
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
