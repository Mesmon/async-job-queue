import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { UploadService } from "./upload.service.js";

const requestSchema = z.object({ fileName: z.string() });

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("token")
  async getToken(@Body() body: unknown) {
    const { fileName } = requestSchema.parse(body);
    return this.uploadService.generateSasToken(fileName);
  }
}
