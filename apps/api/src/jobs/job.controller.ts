import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
} from "@nestjs/common";
import { type CreateJobRequest, createJobRequestSchema } from "@repo/shared";
import { z } from "zod";
import { JobsService } from "./job.service.js";

@Controller("jobs")
export class JobsController {
  constructor(@Inject(JobsService) private readonly jobsService: JobsService) {}

  @Post()
  async create(@Body() body: CreateJobRequest) {
    const parseResult = createJobRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new HttpException(z.treeifyError(parseResult.error), HttpStatus.BAD_REQUEST);
    }

    return this.jobsService.createJob(parseResult.data);
  }

  @Get(":id")
  async getStatus(@Param("id") id: string) {
    return this.jobsService.getJobStatus(id);
  }
}
