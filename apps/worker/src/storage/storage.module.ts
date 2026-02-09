import { Global, Module, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createStorageProvider } from "@repo/storage";

export const STORAGE_PROVIDER = "STORAGE_PROVIDER";

const storageProvider: Provider = {
  provide: STORAGE_PROVIDER,
  useFactory: (config: ConfigService) => {
    const provider = config.get<string>("STORAGE_PROVIDER") || "azure";

    if (provider === "azure") {
      const azureConn = config.getOrThrow<string>("AZURE_STORAGE_CONNECTION_STRING");
      return createStorageProvider({
        provider: "azure",
        azure: {
          connectionString: azureConn,
          containerName: config.get<string>("AZURE_INPUT_CONTAINER"),
        },
      });
    }

    if (provider === "aws") {
      return createStorageProvider({
        provider: "aws",
        aws: {
          region: config.getOrThrow<string>("AWS_REGION"),
          accessKeyId: config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
          secretAccessKey: config.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
          bucketName: config.get<string>("AWS_INPUT_BUCKET"),
          endpoint: config.get<string>("AWS_ENDPOINT"),
        },
      });
    }

    throw new Error(`Unsupported storage provider: ${provider}`);
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [storageProvider],
  exports: [storageProvider],
})
export class StorageModule {}
