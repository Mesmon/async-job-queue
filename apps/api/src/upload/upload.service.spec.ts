import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadService } from "./upload.service.js";

// Mock Azure SDK
vi.mock("@azure/storage-blob", () => {
  return {
    BlobServiceClient: {
      fromConnectionString: vi.fn().mockReturnValue({
        setProperties: vi.fn().mockResolvedValue({}),
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

  describe("generateSasToken", () => {
    it("should generate a SAS token", async () => {
      const filename = "test-image.jpg";
      const result = await service.generateSasToken(filename);

      expect(result).toEqual({
        uploadUrl: "mock-sas-url",
        blobPath: expect.stringContaining("test-image.jpg"),
      });

      // Verify internal calls
      // 1. Container created
      // biome-ignore lint/complexity/useLiteralKeys: accessing private property for testing
      const containerClient = service["blobServiceClient"].getContainerClient("test-container");
      expect(containerClient.createIfNotExists).toHaveBeenCalled();

      // 2. CORS set
      // biome-ignore lint/complexity/useLiteralKeys: accessing private property for testing
      expect(service["blobServiceClient"].setProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          cors: expect.arrayContaining([
            expect.objectContaining({
              allowedOrigins: "*",
              allowedMethods: "GET,PUT,POST,OPTIONS",
            }),
          ]),
        }),
      );
    });
  });
});
