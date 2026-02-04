import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { db, eq, jobs } from "@repo/database";
import { CreateJobRequest, JobStatus } from "@repo/shared";
import { Queue } from "bullmq";

@Injectable()
export class JobsService {
  constructor(@InjectQueue("image-processing") private jobQueue: Queue) {}

  async createJob(dto: CreateJobRequest) {
    const [record] = await db
      .insert(jobs)
      .values({
        prompt: dto.prompt,
        inputPath: dto.inputImagePath,
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
    return job;
  }
}
