import { BlobServiceClient } from "@azure/storage-blob";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db, eq, jobs } from "@repo/database";
import { JobStatus } from "@repo/shared";
import type { Job } from "bullmq";
import { AzureFluxService } from "../inference/azure-flux.service.js";

@Processor("image-processing")
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name, { timestamp: true });
  private blobServiceClient: BlobServiceClient;
  private inputContainer: string;
  private outputContainer: string;

  constructor(
    @Inject(ConfigService) private config: ConfigService,
    @Inject(AzureFluxService) private fluxService: AzureFluxService,
  ) {
    super();
    // Initialize Azure
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      this.config.getOrThrow("AZURE_STORAGE_CONNECTION_STRING"),
    );
    this.inputContainer = this.config.getOrThrow("AZURE_INPUT_CONTAINER");
    this.outputContainer = this.config.getOrThrow("AZURE_OUTPUT_CONTAINER");
  }

  async process(job: Job<{ jobId: string }>): Promise<void> {
    const { jobId } = job.data;
    this.logger.log(`[Worker] Processing Job ${jobId} via Azure FLUX.2-pro...`);

    try {
      // 1. Fetch Job Metadata
      const [jobRecord] = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (!jobRecord) {
        throw new Error("Job record not found");
      }

      // 2. Set Status -> PROCESSING
      await db.update(jobs).set({ status: JobStatus.enum.PROCESSING }).where(eq(jobs.id, jobId));

      // 3. Download Input Image (User upload)
      const inputBuffer = await this.downloadFromAzure(jobRecord.inputPath);

      // 4. Call FLUX.2-pro
      const outputBuffer = await this.fluxService.generateImage(inputBuffer, jobRecord.prompt);

      // 5. Upload Output Image
      // FLUX returns high quality images, PNG is best to preserve details
      const outputFilename = `result-${jobId}.png`;
      await this.uploadToAzure(outputBuffer, outputFilename);

      // 6. Update Status -> COMPLETED
      await db
        .update(jobs)
        .set({
          status: JobStatus.enum.COMPLETED,
          outputPath: outputFilename,
        })
        .where(eq(jobs.id, jobId));

      this.logger.log(`[Worker] Job ${jobId} Completed!`);
    } catch (error) {
      this.logger.error(`[Worker] Job ${jobId} Failed:`, error);

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
