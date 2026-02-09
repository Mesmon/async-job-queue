import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db, eq, jobs } from "@repo/database";
import { JobStatus } from "@repo/shared";
import type { StorageProvider } from "@repo/storage";
import type { Job } from "bullmq";
import sharp from "sharp";
import { STORAGE_PROVIDER } from "../storage/storage.module.js";

@Processor("image-processing")
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name, { timestamp: true });
  private inputContainer: string;
  private outputContainer: string;

  constructor(
    @Inject(ConfigService) private config: ConfigService,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {
    super();
    const provider = this.config.get<string>("STORAGE_PROVIDER") || "azure";
    this.inputContainer =
      provider === "azure"
        ? this.config.getOrThrow("AZURE_INPUT_CONTAINER")
        : this.config.getOrThrow("AWS_INPUT_BUCKET");
    this.outputContainer =
      provider === "azure"
        ? this.config.getOrThrow("AZURE_OUTPUT_CONTAINER")
        : this.config.getOrThrow("AWS_OUTPUT_BUCKET");
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
      const inputBuffer = await this.downloadImage(jobRecord.inputPath);

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

      this.logger.log(`[Worker] Processing image for Job ${jobId}...`);
      const outputBuffer = await pipeline.png().toBuffer();

      // 4.5 Random failure to demonstrate retries
      if (this.shouldSimulateFailure()) {
        throw new Error("Random simulated failure to demonstrate BullMQ retries");
      }

      // 5. Upload Output Image
      const outputFilename = `result-${jobId}.png`;
      await this.uploadImage(outputBuffer, outputFilename);

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

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await db
        .update(jobs)
        .set({
          status: JobStatus.enum.FAILED,
          error: errorMessage,
        })
        .where(eq(jobs.id, jobId));

      throw error; // Make BullMQ mark it as failed so it can retry if configured
    }
  }

  // --- Helpers ---

  private async downloadImage(blobName: string): Promise<Buffer> {
    return this.storage.download(blobName, { bucket: this.inputContainer });
  }

  private async uploadImage(buffer: Buffer, blobName: string) {
    await this.storage.upload(blobName, buffer, { bucket: this.outputContainer });
  }

  private shouldSimulateFailure(): boolean {
    return Math.random() < 0.3;
  }
}
