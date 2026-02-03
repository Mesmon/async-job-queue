import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadService } from "./upload.service.js";

// Mock Azure SDK
vi.mock("@azure/storage-blob", () => {
  return {
    BlobServiceClient: {
      fromConnectionString: vi.fn().mockReturnValue({
        getContainerClient: vi.fn().mockReturnValue({
          createIfNotExists: vi.fn(),
          getBlockBlobClient: vi.fn().mockReturnValue({
            generateSasUrl: vi.fn().mockReturnValue("mock-sas-url"),
          }),
        }),
      }),
    },
    BlobSASPermissions: {
      parse: vi.fn(),
    },
  };
});

describe("UploadService", () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn((key) => {
              if (key === "AZURE_STORAGE_CONNECTION_STRING") {
                return "UseDevelopmentStorage=true";
              }
              if (key === "AZURE_CONTAINER_NAME") {
                return "test-container";
              }
              return "mock-value";
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
