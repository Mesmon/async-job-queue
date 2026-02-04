import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { addMinutes } from "date-fns";
import { generateBlobName } from "../helpers/blob-helper.js";

@Injectable()
export class UploadService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    // Initialize Azure Client
    const connectionString = this.config.getOrThrow<string>("AZURE_STORAGE_CONNECTION_STRING");
    this.containerName = this.config.getOrThrow<string>("AZURE_CONTAINER_NAME");

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString, {});
  }

  async generateSasToken(filename: string) {
    // 1. Ensure container exists (good for dev, optional for prod)
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.createIfNotExists();

    // 2. Configure CORS (Essential for direct browser uploads)
    await this.blobServiceClient.setProperties({
      cors: [
        {
          allowedOrigins: "*", // TODO: In production, replace with your specific origin like http://localhost:3001
          allowedMethods: "GET,PUT,POST,OPTIONS",
          allowedHeaders: "*",
          exposedHeaders: "*",
          maxAgeInSeconds: 3600,
        },
      ],
    });

    // 3. Setup permissions (Write only, expires in 10 mins)
    const startsOn = new Date();
    const expiresOn = addMinutes(new Date(), 10);
    const permissions = BlobSASPermissions.parse("w"); // Write only

    // 3. Generate SAS
    // Note: In local Azurite, we extract creds from the connection string manually or use the helper
    // For simplicity with standard connection strings:
    const blobName = generateBlobName(filename);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const sasToken = await blockBlobClient.generateSasUrl({
      permissions,
      expiresOn,
      startsOn,
    });

    return {
      uploadUrl: sasToken, // The full URL the frontend will use to upload the file
      blobPath: blobName, // The 'key' we store in the DB
    };
  }
}
