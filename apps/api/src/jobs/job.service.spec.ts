import { getQueueToken } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { db, jobs } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobsService } from "./job.service.js";

const { databaseMock, createMockJob } = await vi.hoisted(() => import("@repo/database/testing"));

// Mock @repo/database using the centralized testing mock
vi.mock("@repo/database", () => databaseMock);

// Mock Azure SDK
vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn().mockReturnValue({
      getContainerClient: vi.fn().mockReturnValue({
        getBlockBlobClient: vi.fn().mockReturnValue({
          generateSasUrl: vi.fn().mockResolvedValue("mock-sas-url"),
        }),
      }),
    }),
  },
  BlobSASPermissions: {
    parse: vi.fn(),
  },
}));

describe("JobsService", () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getQueueToken("image-processing"),
          useValue: {
            add: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn((key) => {
              if (key === "AZURE_STORAGE_CONNECTION_STRING") {
                return "UseDevelopmentStorage=true";
              }
              if (key === "AZURE_OUTPUT_CONTAINER") {
                return "output-container";
              }
              return "mock-value";
            }),
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createJob", () => {
    it("should create a job and add to queue", async () => {
      const dto = { inputPath: "test.jpg", processingOptions: { type: "GRAYSCALE" as const } };
      const mockJob = createMockJob({ ...dto });

      vi.mocked(db.insert(jobs).values).mockReturnThis();
      vi.mocked(
        db.insert(jobs).values({ inputPath: "test.jpg", status: "QUEUED" }).returning,
      ).mockResolvedValue([mockJob]);

      const result = await service.createJob(dto);

      expect(result).toEqual(mockJob);
      // biome-ignore lint/complexity/useLiteralKeys: for testing purposes, we want to ensure the correct job ID is sent to the queue
      const queue = service["jobQueue"];
      expect(queue.add).toHaveBeenCalledWith("transcode", { jobId: mockJob.id });
    });
  });

  describe("getJobStatus", () => {
    it("should return job status without output path if not completed", async () => {
      const mockJob = createMockJob({ status: "PROCESSING" });
      vi.mocked(db.select().from(jobs).where).mockResolvedValue([mockJob]);

      const result = await service.getJobStatus("mock-job-id");

      expect(result).toEqual(mockJob);
    });

    it("should return job status with SAS token for output path if completed", async () => {
      const mockJob = createMockJob({ status: "COMPLETED", outputPath: "out.png" });
      vi.mocked(db.select().from(jobs).where).mockResolvedValue([mockJob]);

      const result = await service.getJobStatus("mock-job-id");

      expect(result.outputPath).toBe("mock-sas-url");
      expect(result.status).toBe("COMPLETED");
    });

    it("should throw error if job not found", async () => {
      vi.mocked(db.select().from(jobs).where).mockResolvedValue([]);

      await expect(service.getJobStatus("non-existent")).rejects.toThrow("Job not found");
    });
  });
});
