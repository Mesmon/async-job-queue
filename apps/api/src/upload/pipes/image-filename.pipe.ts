import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type { UploadFileRequest } from "@repo/shared";

@Injectable()
export class ImageFileNamePipe implements PipeTransform {
  transform(uploadFileRequestBody: UploadFileRequest) {
    const { filename } = uploadFileRequestBody;
    if (!filename || filename.trim().length === 0) {
      throw new BadRequestException("Filename is required.");
    }

    const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageRegex.test(filename)) {
      throw new BadRequestException(
        "Invalid file type. Only image files (jpg, jpeg, png, gif, webp) are allowed.",
      );
    }

    return uploadFileRequestBody;
  }
}
