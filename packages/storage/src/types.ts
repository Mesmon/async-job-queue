export interface StorageConfig {
  provider: "azure" | "aws";
  azure?: {
    connectionString: string;
    containerName?: string;
  };
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName?: string;
    endpoint?: string;
  };
}

export interface UploadUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  bucket?: string;
}

export interface DownloadUrlOptions {
  expiresIn?: number; // seconds
  bucket?: string;
}
