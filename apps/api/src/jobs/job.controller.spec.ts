import { HttpException, HttpStatus } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JobsController } from "./job.controller.js";
import { JobsService } from "./job.service.js";

describe("JobsController", () => {
  let controller: JobsController;
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: {
            createJob: vi.fn(),
            getJobStatus: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    service = module.get<JobsService>(JobsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a job when body is valid", async () => {
      const validBody = {
        inputPath: "test.jpg",
        processingOptions: { type: "GRAYSCALE" as const },
      };
      const mockResult = { id: "123", ...validBody, status: "QUEUED" };
      // biome-ignore lint/suspicious/noExplicitAny: mocking service response
      vi.mocked(service.createJob).mockResolvedValue(mockResult as any);

      const result = await controller.create(validBody);

      expect(result).toEqual(mockResult);
      expect(service.createJob).toHaveBeenCalledWith(validBody);
    });

    it("should throw HttpException when body is invalid", async () => {
      const invalidBody = {
        inputPath: "", // Empty inputPath is invalid
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        processingOptions: { type: "INVALID" as any },
      };

      // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
      await expect(controller.create(invalidBody as any)).rejects.toThrow(HttpException);
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
      await expect(controller.create(invalidBody as any)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe("getStatus", () => {
    it("should return job status", async () => {
      const id = "123";
      const mockStatus = { id, status: "COMPLETED" };
      // biome-ignore lint/suspicious/noExplicitAny: mocking service response
      vi.mocked(service.getJobStatus).mockResolvedValue(mockStatus as any);

      const result = await controller.getStatus(id);

      expect(result).toEqual(mockStatus);
      expect(service.getJobStatus).toHaveBeenCalledWith(id);
    });
  });
});
