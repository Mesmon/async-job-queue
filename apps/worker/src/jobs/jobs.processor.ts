import { BlobServiceClient } from "@azure/storage-blob";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db, eq, jobs } from "@repo/database";
import { JobStatus } from "@repo/shared";
import type { Job } from "bullmq";
import sharp from "sharp";

@Processor("image-processing")
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name, { timestamp: true });
  private blobServiceClient: BlobServiceClient;
  private inputContainer: string;
  private outputContainer: string;

  constructor(@Inject(ConfigService) private config: ConfigService) {
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
    this.logger.log(`[Worker] Processing Job ${jobId}...`);

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

      // 4. Process Image with Sharp
      if (!jobRecord.processingOptions) {
        throw new Error("Processing options not found");
      }
      const filterType = jobRecord.processingOptions.type;
      const watermarkText = jobRecord.processingOptions.watermark_text;
      let pipeline = sharp(inputBuffer);

      if (jobRecord.processingOptions) {
        switch (filterType) {
          case "GRAYSCALE":
            pipeline = pipeline.grayscale();
            break;
          case "BLUR":
            pipeline = pipeline.blur(10);
            break;
          case "RESIZE":
            pipeline = pipeline.resize(800, 600);
            break;
          default:
            throw new Error(`Unknown processing type: ${filterType satisfies never}`);
        }
        if (watermarkText) {
          const svgWatermark = `<svg width="800" height="600">
            <text x="10" y="50" font-size="48" fill="white" opacity="0.5">${watermarkText}</text>
          </svg>`;
          pipeline = pipeline.composite([
            {
              input: Buffer.from(svgWatermark),
              gravity: "southeast",
            },
          ]);
        }
      }

      this.logger.log(`[Worker] Simulating heavy CPU work for Job ${jobId} for 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const outputBuffer = await pipeline.png().toBuffer();

      // 4.5 Random failure to demonstrate retries
      if (this.shouldSimulateFailure()) {
        throw new Error("Random simulated failure to demonstrate BullMQ retries");
      }

      // 5. Upload Output Image
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

  private shouldSimulateFailure(): boolean {
    return Math.random() < 0.3;
  }
}
