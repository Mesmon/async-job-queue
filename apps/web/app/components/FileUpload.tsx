"use client";

import type { UploadFileRequest } from "@repo/shared/schemas";
import { Loader2, Send, Upload } from "lucide-react";
import { useState } from "react";
import { JobStatus } from "./JobStatus";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !prompt) {
      setStatus("Please select a file and enter a prompt.");
      return;
    }

    setIsUploading(true);
    setStatus("Getting upload token...");
    setActiveJobId(null);

    try {
      const tokenResponse = await fetch("http://localhost:3000/upload/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: file.name } as UploadFileRequest),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get upload token");
      }

      const { uploadUrl, blobPath } = await tokenResponse.json();

      setStatus("Uploading to storage...");
      const uploadToAzure = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadToAzure.ok) {
        throw new Error("Failed to upload to Azure Storage");
      }

      setStatus("Creating job...");
      const jobResponse = await fetch("http://localhost:3000/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          inputImagePath: blobPath,
        }),
      });

      if (!jobResponse.ok) {
        throw new Error("Failed to create job");
      }

      const job = await jobResponse.json();
      setStatus("Job created successfully!");
      setActiveJobId(job.id);
      setFile(null);
      setPrompt("");
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            New Processing Job
          </CardTitle>
          <CardDescription>
            Upload an image and provide instructions for processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Image File</label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Processing Prompt</label>
            <Input
              placeholder="e.g. Convert this image to grayscale and resize to 800px"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !prompt}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Job
              </>
            )}
          </Button>
          {status && !isUploading && (
            <p
              className={`text-sm text-center ${status.startsWith("Error") ? "text-red-500" : "text-green-600"}`}
            >
              {status}
            </p>
          )}
        </CardFooter>
      </Card>

      {activeJobId && <JobStatus jobId={activeJobId} />}
    </div>
  );
}
