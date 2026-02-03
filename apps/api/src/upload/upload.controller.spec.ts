import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UploadController } from "./upload.controller.js";
import { UploadService } from "./upload.service.js";

describe("UploadController", () => {
  let controller: UploadController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
});
