import { Body, Controller, Inject, Post, UsePipes } from "@nestjs/common";
import { type UploadFileRequest, uploadFileRequestSchema } from "@repo/shared/schemas";
import { ImageFileNamePipe } from "./pipes/image-filename.pipe.js";
import { UploadService } from "./upload.service.js";

@Controller("upload")
export class UploadController {
  constructor(@Inject(UploadService) private readonly uploadService: UploadService) {}

  @Post("token")
  @UsePipes(new ImageFileNamePipe())
  async getToken(@Body() body: UploadFileRequest) {
    const { filename } = uploadFileRequestSchema.parse(body);
    return this.uploadService.generateSasToken(filename);
  }
}
