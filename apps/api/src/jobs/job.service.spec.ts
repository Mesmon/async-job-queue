import { getQueueToken } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { db, jobs } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_PROVIDER } from "../storage/storage.module.js";
import { JobsService } from "./job.service.js";

const { databaseMock, createMockJob } = await vi.hoisted(() => import("@repo/database/testing"));

// Mock @repo/database using the centralized testing mock
vi.mock("@repo/database", () => databaseMock);

describe("JobsService", () => {
  let service: JobsService;
  let storageProviderMock: { generateDownloadUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storageProviderMock = {
      generateDownloadUrl: vi.fn().mockResolvedValue("mock-sas-url"),
    };

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
            get: vi.fn((key) => {
              if (key === "STORAGE_PROVIDER") {
                return "azure";
              }
              return null;
            }),
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
        {
          provide: STORAGE_PROVIDER,
          useValue: storageProviderMock,
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
      // biome-ignore lint/complexity/useLiteralKeys: for testing purposes
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
      expect(storageProviderMock.generateDownloadUrl).toHaveBeenCalledWith("out.png", {
        expiresIn: 3600,
        bucket: "output-container",
      });
    });

    it("should return job status with SAS token for AWS if configured", async () => {
      const awsModule: TestingModule = await Test.createTestingModule({
        providers: [
          JobsService,
          { provide: getQueueToken("image-processing"), useValue: { add: vi.fn() } },
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn((key) => (key === "STORAGE_PROVIDER" ? "aws" : null)),
              getOrThrow: vi.fn((key) => (key === "AWS_OUTPUT_BUCKET" ? "aws-bucket" : "mock")),
            },
          },
          { provide: STORAGE_PROVIDER, useValue: storageProviderMock },
        ],
      }).compile();
      const awsService = awsModule.get<JobsService>(JobsService);

      const mockJob = createMockJob({ status: "COMPLETED", outputPath: "out.png" });
      vi.mocked(db.select().from(jobs).where).mockResolvedValue([mockJob]);

      await awsService.getJobStatus("mock-job-id");

      expect(storageProviderMock.generateDownloadUrl).toHaveBeenCalledWith("out.png", {
        expiresIn: 3600,
        bucket: "aws-bucket",
      });
    });

    it("should use azure as default provider if STORAGE_PROVIDER is not set", async () => {
      const defaultModule: TestingModule = await Test.createTestingModule({
        providers: [
          JobsService,
          { provide: getQueueToken("image-processing"), useValue: { add: vi.fn() } },
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn(() => null),
              getOrThrow: vi.fn((key) =>
                key === "AZURE_OUTPUT_CONTAINER" ? "azure-bucket" : "mock",
              ),
            },
          },
          { provide: STORAGE_PROVIDER, useValue: storageProviderMock },
        ],
      }).compile();
      const defaultService = defaultModule.get<JobsService>(JobsService);

      const mockJob = createMockJob({ status: "COMPLETED", outputPath: "out.png" });
      vi.mocked(db.select().from(jobs).where).mockResolvedValue([mockJob]);

      await defaultService.getJobStatus("mock-job-id");

      expect(storageProviderMock.generateDownloadUrl).toHaveBeenCalledWith("out.png", {
        expiresIn: 3600,
        bucket: "azure-bucket",
      });
    });

    it("should throw error if job not found", async () => {
      vi.mocked(db.select().from(jobs).where).mockResolvedValue([]);

      await expect(service.getJobStatus("non-existent")).rejects.toThrow("Job not found");
    });
  });
});
