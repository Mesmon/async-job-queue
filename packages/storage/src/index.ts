import { AwsStorageProvider } from "./providers/aws.js";
import { AzureStorageProvider } from "./providers/azure.js";
import type { StorageProvider } from "./storage-provider.js";
import type { StorageConfig } from "./types.js";

export * from "./storage-provider.js";
export * from "./types.js";

export function createStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.provider) {
    case "azure":
      return new AzureStorageProvider(config);
    case "aws":
      return new AwsStorageProvider(config);
    default:
      throw new Error(`Unsupported storage provider: ${config.provider}`);
  }
}
