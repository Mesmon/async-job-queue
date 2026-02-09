import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { STORAGE_PROVIDER, StorageModule } from "./storage.module.js";

describe("StorageModule", () => {
  it("should provide Azure storage by default", async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), StorageModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key) => {
          if (key === "STORAGE_PROVIDER") {
            return undefined;
          }
          return "mock";
        }),
        getOrThrow: vi.fn((key) => {
          if (key === "AZURE_STORAGE_CONNECTION_STRING") {
            return "DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";
          }
          return "mock";
        }),
      })
      .compile();

    const provider = module.get(STORAGE_PROVIDER);
    expect(provider).toBeDefined();
    expect(provider.constructor.name).toBe("AzureStorageProvider");
  });

  it("should provide AWS storage when configured", async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), StorageModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn((key) => {
          if (key === "STORAGE_PROVIDER") {
            return "aws";
          }
          return "mock";
        }),
        getOrThrow: vi.fn((key) => {
          if (key === "AZURE_STORAGE_CONNECTION_STRING") {
            return "DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";
          }
          return "mock";
        }),
      })
      .compile();

    const provider = module.get(STORAGE_PROVIDER);
    expect(provider).toBeDefined();
    expect(provider.constructor.name).toBe("AwsStorageProvider");
  });
});
