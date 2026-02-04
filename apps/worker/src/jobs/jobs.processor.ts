import { BlobServiceClient } from "@azure/storage-blob";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db, eq, jobs } from "@repo/database";
import { JobStatus } from "@repo/shared";
import type { Job } from "bullmq";
import { HuggingFaceService } from "../inference/hugging-face.service.js";

@Processor("image-processing")
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name, { timestamp: true });

  private blobServiceClient: BlobServiceClient;
  private inputContainer: string;
  private outputContainer: string;

  constructor(
    @Inject(ConfigService) private config: ConfigService,
    @Inject(HuggingFaceService) private hfService: HuggingFaceService,
  ) {
    super();
    // Initialize Azure
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      this.config.getOrThrow("AZURE_STORAGE_CONNECTION_STRING"),
    );
    this.inputContainer = this.config.getOrThrow("AZURE_INPUT_CONTAINER");
    this.outputContainer = this.config.getOrThrow("AZURE_OUTPUT_CONTAINER");
  }

  // This method runs for every job in the queue
  async process(job: Job<{ jobId: string }>): Promise<void> {
    const { jobId } = job.data;
    this.logger.log(`[Worker] Processing Job ${jobId}...`);

    try {
      // 1. Fetch Job Metadata from DB
      const [jobRecord] = await db.select().from(jobs).where(eq(jobs.id, jobId));

      if (!jobRecord) {
        throw new Error("Job record not found in DB");
      }

      // 2. Update Status -> PROCESSING
      await db.update(jobs).set({ status: JobStatus.enum.PROCESSING }).where(eq(jobs.id, jobId));

      // 3. Download Image from Azure (Input)
      const inputBuffer = await this.downloadFromAzure(jobRecord.inputPath);

      // 4. Call AI Inference
      this.logger.log("[Worker] Sending to Hugging Face...");
      const outputBuffer = await this.hfService.generateImage(inputBuffer, jobRecord.prompt);

      // 5. Upload Result to Azure (Output)
      const outputFilename = `result-${jobId}.jpg`;
      await this.uploadToAzure(outputBuffer, outputFilename);

      // 6. Update Status -> COMPLETED
      await db
        .update(jobs)
        .set({
          status: JobStatus.enum.COMPLETED,
          outputPath: outputFilename, // Save the reference
        })
        .where(eq(jobs.id, jobId));

      this.logger.log(`[Worker] Job ${jobId} Completed!`);
    } catch (error) {
      this.logger.error(`[Worker] Job ${jobId} Failed:`, error);

      // 7. Handle Failure
      await db
        .update(jobs)
        .set({
          status: JobStatus.enum.FAILED,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(jobs.id, jobId));

      throw error; // Make BullMQ mark it as failed so it can retry if configured
    }
  }

  // --- Helpers ---

  private async downloadFromAzure(blobName: string): Promise<Buffer> {
    const containerClient = this.blobServiceClient.getContainerClient(this.inputContainer);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Download to a buffer
    const downloadBlockBlobResponse = await blobClient.download(0);
    return await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody!);
  }

  private async uploadToAzure(buffer: Buffer, blobName: string) {
    const containerClient = this.blobServiceClient.getContainerClient(this.outputContainer);
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.upload(buffer, buffer.length);
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on("data", (data) =>
        chunks.push(data instanceof Buffer ? data : Buffer.from(data)),
      );
      readableStream.on("end", () => resolve(Buffer.concat(chunks)));
      readableStream.on("error", reject);
    });
  }
}
