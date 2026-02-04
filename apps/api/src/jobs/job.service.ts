import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
import { InjectQueue } from "@nestjs/bullmq";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db, eq, jobs } from "@repo/database";
import { CreateJobRequest, JobStatus } from "@repo/shared";
import { Queue } from "bullmq";
import { addMinutes } from "date-fns";

@Injectable()
export class JobsService {
  private blobServiceClient: BlobServiceClient;
  private outputContainerName: string;

  constructor(
    @InjectQueue("image-processing") private jobQueue: Queue,
    @Inject(ConfigService) private config: ConfigService,
  ) {
    const connectionString = this.config.getOrThrow<string>("AZURE_STORAGE_CONNECTION_STRING");
    this.outputContainerName = this.config.getOrThrow<string>("AZURE_OUTPUT_CONTAINER");
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
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
      const containerClient = this.blobServiceClient.getContainerClient(this.outputContainerName);
      const blobClient = containerClient.getBlockBlobClient(job.outputPath);

      const sasToken = await blobClient.generateSasUrl({
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn: addMinutes(new Date(), 60),
      });

      job.outputPath = sasToken;
    }

    return job;
  }
}
