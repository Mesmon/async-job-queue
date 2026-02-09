import { InjectQueue } from "@nestjs/bullmq";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db, eq, jobs } from "@repo/database";
import { CreateJobRequest, JobStatus } from "@repo/shared";
import { StorageProvider } from "@repo/storage";
import { Queue } from "bullmq";
import { STORAGE_PROVIDER } from "../storage/storage.module.js";

@Injectable()
export class JobsService {
  private outputContainerName: string;

  constructor(
    @InjectQueue("image-processing") private jobQueue: Queue,
    @Inject(ConfigService) private config: ConfigService,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {
    const provider = this.config.get<string>("STORAGE_PROVIDER") || "azure";
    this.outputContainerName =
      provider === "azure"
        ? this.config.getOrThrow<string>("AZURE_OUTPUT_CONTAINER")
        : this.config.getOrThrow<string>("AWS_OUTPUT_BUCKET");
  }

  async createJob(dto: CreateJobRequest) {
    const [record] = await db
      .insert(jobs)
      .values({
        inputPath: dto.inputPath,
        processingOptions: dto.processingOptions,
        status: JobStatus.enum.QUEUED,
      })
      .returning();

    // We only send the ID to the queue. The worker will fetch data from DB.
    await this.jobQueue.add("transcode", {
      jobId: record.id,
    });

    return record;
  }

  async getJobStatus(id: string) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.outputPath) {
      const sasToken = await this.storage.generateDownloadUrl(job.outputPath, {
        expiresIn: 3600, // 60 minutes
        bucket: this.outputContainerName,
      });

      job.outputPath = sasToken;
    }

    return job;
  }
}
