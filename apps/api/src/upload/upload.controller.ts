import {type CreateJobRequest, createJobRequestSchema} from "@repo/shared/job"
import { Body, Controller, Post } from "@nestjs/common";
import { UploadService } from "./upload.service.js";

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("token")
  async getToken(@Body() body: CreateJobRequest) {
    const { prompt, inputImagePath } = createJobRequestSchema.parse(body);
    return this.uploadService.generateSasToken(inputImagePath);
  }
}
