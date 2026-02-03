import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from "@nestjs/common";
import { createJobRequestSchema } from "@repo/shared";
import { z } from "zod";
import { JobsService } from "./job.service.js";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async create(@Body() body: unknown) {
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
