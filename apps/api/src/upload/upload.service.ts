import { Inject, Injectable } from "@nestjs/common";
import { StorageProvider } from "@repo/storage";
import { generateBlobName } from "../helpers/blob-helper.js";
import { STORAGE_PROVIDER } from "../storage/storage.module.js";

@Injectable()
export class UploadService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  async generateSasToken(filename: string) {
    const blobName = generateBlobName(filename);
    const { uploadUrl, key } = await this.storage.generateUploadUrl(blobName);

    return {
      uploadUrl,
      blobPath: key,
    };
  }
}
