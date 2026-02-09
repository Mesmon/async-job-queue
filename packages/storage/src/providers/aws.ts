import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "../storage-provider.js";
import type { DownloadUrlOptions, StorageConfig, UploadUrlOptions } from "../types.js";

export class AwsStorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: StorageConfig) {
    if (config.provider !== "aws" || !config.aws) {
      throw new Error("Invalid configuration for AWS Storage Provider");
    }

    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
      endpoint: config.aws.endpoint,
      forcePathStyle: !!config.aws.endpoint,
    });
    this.bucketName = config.aws.bucketName || "default-bucket";
  }

  async generateUploadUrl(
    path: string,
    options?: UploadUrlOptions,
  ): Promise<{ uploadUrl: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: options?.bucket || this.bucketName,
      Key: path,
      ContentType: options?.contentType,
    });

    const expiresIn = options?.expiresIn || 600;
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key: path,
    };
  }

  async generateDownloadUrl(path: string, options?: DownloadUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: options?.bucket || this.bucketName,
      Key: path,
    });

    const expiresIn = options?.expiresIn || 3600;
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async upload(
    path: string,
    body: Buffer | Uint8Array | string,
    options?: { bucket?: string },
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: options?.bucket || this.bucketName,
      Key: path,
      Body: body,
    });

    await this.s3Client.send(command);
  }

  async download(path: string, options?: { bucket?: string }): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: options?.bucket || this.bucketName,
      Key: path,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error("No body in response");
    }

    // Convert stream to buffer
    const stream = response.Body as unknown as NodeJS.ReadableStream;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }
}
