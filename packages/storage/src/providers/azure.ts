import { BlobSASPermissions, BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import type { StorageProvider } from "../storage-provider.js";
import type { DownloadUrlOptions, StorageConfig, UploadUrlOptions } from "../types.js";

export class AzureStorageProvider implements StorageProvider {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(config: StorageConfig) {
    if (config.provider !== "azure" || !config.azure) {
      throw new Error("Invalid configuration for Azure Storage Provider");
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    this.containerName = config.azure.containerName || "default-container";
  }

  private getContainerClient(containerName?: string): ContainerClient {
    return this.blobServiceClient.getContainerClient(containerName || this.containerName);
  }

  async generateUploadUrl(
    path: string,
    options?: UploadUrlOptions,
  ): Promise<{ uploadUrl: string; key: string }> {
    const containerClient = this.getContainerClient(options?.bucket);
    await containerClient.createIfNotExists();

    // Configure CORS for direct browser uploads
    // TODO: Make this configurable or optional
    await this.blobServiceClient.setProperties({
      cors: [
        {
          allowedOrigins: "*",
          allowedMethods: "GET,PUT,POST,OPTIONS",
          allowedHeaders: "*",
          exposedHeaders: "*",
          maxAgeInSeconds: 3600,
        },
      ],
    });

    const expiresOn = new Date(Date.now() + (options?.expiresIn || 600) * 1000); // Default 10 mins
    const startsOn = new Date();
    // Reduce clock skew issues
    startsOn.setMinutes(startsOn.getMinutes() - 5);

    const permissions = BlobSASPermissions.parse("w"); // Write only

    const blobClient = containerClient.getBlockBlobClient(path);
    const sasToken = await blobClient.generateSasUrl({
      permissions,
      expiresOn,
      startsOn,
    });

    return {
      uploadUrl: sasToken,
      key: path,
    };
  }

  async generateDownloadUrl(path: string, options?: DownloadUrlOptions): Promise<string> {
    const containerClient = this.getContainerClient(options?.bucket);
    const blobClient = containerClient.getBlockBlobClient(path);

    const expiresOn = new Date(Date.now() + (options?.expiresIn || 3600) * 1000); // Default 1 hour
    const startsOn = new Date();
    startsOn.setMinutes(startsOn.getMinutes() - 5);

    const permissions = BlobSASPermissions.parse("r"); // Read only

    const sasToken = await blobClient.generateSasUrl({
      permissions,
      expiresOn,
      startsOn,
    });

    return sasToken;
  }

  async upload(
    path: string,
    body: Buffer | Uint8Array | string,
    options?: { bucket?: string },
  ): Promise<void> {
    const containerClient = this.getContainerClient(options?.bucket);
    await containerClient.createIfNotExists();
    const blobClient = containerClient.getBlockBlobClient(path);

    if (typeof body === "string") {
      await blobClient.upload(body, body.length);
    } else {
      await blobClient.upload(body, body.length);
    }
  }

  async download(path: string, options?: { bucket?: string }): Promise<Buffer> {
    const containerClient = this.getContainerClient(options?.bucket);
    const blobClient = containerClient.getBlockBlobClient(path);

    const downloadResponse = await blobClient.download(0);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      if (!downloadResponse.readableStreamBody) {
        return reject(new Error("No readable stream body"));
      }

      downloadResponse.readableStreamBody.on("data", (data: ArrayBufferLike) =>
        chunks.push(data instanceof Buffer ? data : Buffer.from(data)),
      );
      downloadResponse.readableStreamBody.on("end", () => resolve(Buffer.concat(chunks)));
      downloadResponse.readableStreamBody.on("error", reject);
    });
  }
}
