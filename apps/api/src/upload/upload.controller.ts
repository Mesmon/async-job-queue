import { Body, Controller, Inject, Post } from "@nestjs/common";
import { type CreateJobRequest, uploadFileRequestSchema } from "@repo/shared/schemas";
import { UploadService } from "./upload.service.js";

@Controller("upload")
export class UploadController {
  constructor(@Inject(UploadService) private readonly uploadService: UploadService) {}

  @Post("token")
  async getToken(@Body() body: CreateJobRequest) {
    const { filename } = uploadFileRequestSchema.parse(body);
    return this.uploadService.generateSasToken(filename);
  }
}
