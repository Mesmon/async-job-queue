import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UploadController } from "./upload.controller.js";
import { UploadService } from "./upload.service.js";

describe("UploadController", () => {
  let controller: UploadController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: {
            generateSasToken: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should generate SAS token", async () => {
    const filename = "test.jpg";
    const service = module.get<UploadService>(UploadService);
    vi.mocked(service.generateSasToken).mockResolvedValue({
      uploadUrl: "mock-url",
      blobPath: "mock-path",
    });

    const result = await controller.getToken({ filename });
    expect(result).toEqual({
      uploadUrl: "mock-url",
      blobPath: "mock-path",
    });
    expect(service.generateSasToken).toHaveBeenCalledWith(filename);
  });
});
