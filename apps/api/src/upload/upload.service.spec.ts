import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_PROVIDER } from "../storage/storage.module.js";
import { UploadService } from "./upload.service.js";

describe("UploadService", () => {
  let service: UploadService;
  let storageProviderMock: { generateUploadUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storageProviderMock = {
      generateUploadUrl: vi.fn().mockResolvedValue({
        uploadUrl: "mock-sas-url",
        key: "mock-key",
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: STORAGE_PROVIDER,
          useValue: storageProviderMock,
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
        blobPath: "mock-key",
      });

      expect(storageProviderMock.generateUploadUrl).toHaveBeenCalledWith(
        expect.stringContaining(filename),
      );
    });
  });
});
