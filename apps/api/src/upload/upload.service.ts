import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { addMinutes } from "date-fns";

@Injectable()
export class UploadService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(private config: ConfigService) {
    // Initialize Azure Client
    const connectionString = this.config.getOrThrow<string>("AZURE_STORAGE_CONNECTION_STRING");
    this.containerName = this.config.getOrThrow<string>("AZURE_CONTAINER_NAME");

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async generateSasToken(filename: string) {
    // 1. Ensure container exists (good for dev, optional for prod)
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.createIfNotExists();

    // 2. Setup permissions (Write only, expires in 10 mins)
    const startsOn = new Date();
    const expiresOn = addMinutes(new Date(), 10);
    const permissions = BlobSASPermissions.parse("w"); // Write only

    // 3. Generate SAS
    // Note: In local Azurite, we extract creds from the connection string manually or use the helper
    // For simplicity with standard connection strings:
    const blobName = `${Date.now()}-${filename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const sasToken = await blockBlobClient.generateSasUrl({
      permissions,
      expiresOn,
      startsOn,
    });

    return {
      uploadUrl: sasToken, // The full URL the frontend puts to
      blobPath: blobName, // The 'key' we store in the DB
    };
  }
}
