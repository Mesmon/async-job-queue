import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { db, jobs } from "@repo/database";
import { JobStatus } from "@repo/shared";
import type { Job } from "bullmq";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_PROVIDER } from "../storage/storage.module.js";
import { JobsProcessor } from "./jobs.processor.js";

const { databaseMock, createMockJob } = await vi.hoisted(() => import("@repo/database/testing"));

// Mock @repo/database using the centralized testing mock
vi.mock("@repo/database", () => databaseMock);

// Mock Sharp
vi.mock("sharp", () => {
  const mockChain = {
    grayscale: vi.fn().mockReturnThis(),
    blur: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    composite: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("processed-image")),
  };
  return {
    default: vi.fn(() => mockChain),
  };
});

describe("JobsProcessor", () => {
  let processor: JobsProcessor;
  let storageProviderMock: { download: ReturnType<typeof vi.fn>; upload: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock Math.random to be deterministic (success by default)
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    // Mock Logger to silence output
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

    storageProviderMock = {
      download: vi.fn().mockResolvedValue(Buffer.from("mock-data")),
      upload: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsProcessor,
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
              if (key === "AZURE_INPUT_CONTAINER") {
                return "input-container";
              }
              if (key === "AZURE_OUTPUT_CONTAINER") {
                return "output-container";
              }
              return null;
            }),
          },
        },
        {
          provide: STORAGE_PROVIDER,
          useValue: storageProviderMock,
        },
      ],
    }).compile();

    processor = module.get<JobsProcessor>(JobsProcessor);

    // Default mocks setup
    vi.mocked(db.update(jobs).set).mockReturnThis();
  });

  it("should be defined", () => {
    expect(processor).toBeDefined();
  });

  it("should process a job successfully", async () => {
    const mockJob = {
      data: { jobId: "test-job-id" },
    } as Job<{ jobId: string }>;

    // Mock DB select response
    vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
      createMockJob({ id: "test-job-id", inputPath: "input.jpg" }),
    ]);

    // Mock Update Where to return something
    // biome-ignore lint/suspicious/noExplicitAny: mocking db response
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    vi.clearAllMocks();

    const processPromise = processor.process(mockJob);
    await processPromise;

    // Verify DB update calls
    // 1. Status PROCESSING
    expect(db.update).toHaveBeenCalled();
    // 2. Status COMPLETED
    expect(db.update).toHaveBeenCalledTimes(2);

    // Verify Storage calls
    expect(storageProviderMock.download).toHaveBeenCalledWith("input.jpg", {
      bucket: "input-container",
    });
    expect(storageProviderMock.upload).toHaveBeenCalledWith(
      expect.stringContaining("result-test-job-id"),
      expect.any(Buffer),
      { bucket: "output-container" },
    );

    // Verify Sharp called
    expect(sharp).toHaveBeenCalled();
  });

  it("should process a job successfully with AWS", async () => {
    const awsModule: TestingModule = await Test.createTestingModule({
      providers: [
        JobsProcessor,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key) => (key === "STORAGE_PROVIDER" ? "aws" : null)),
            getOrThrow: vi.fn((key) => {
              if (key === "AWS_INPUT_BUCKET") {
                return "aws-in";
              }
              if (key === "AWS_OUTPUT_BUCKET") {
                return "aws-out";
              }
              return "mock";
            }),
          },
        },
        { provide: STORAGE_PROVIDER, useValue: storageProviderMock },
      ],
    }).compile();
    const awsProcessor = awsModule.get<JobsProcessor>(JobsProcessor);

    const mockJob = { data: { jobId: "aws-job" } } as Job<{ jobId: string }>;
    vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
      createMockJob({ id: "aws-job", inputPath: "in.jpg" }),
    ]);
    // biome-ignore lint/suspicious/noExplicitAny: mocking db
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    const processPromise = awsProcessor.process(mockJob);
    await processPromise;

    expect(storageProviderMock.download).toHaveBeenCalledWith("in.jpg", { bucket: "aws-in" });
    expect(storageProviderMock.upload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Buffer),
      {
        bucket: "aws-out",
      },
    );
  });

  it("should use azure as default provider if STORAGE_PROVIDER is not set", async () => {
    const defaultModule: TestingModule = await Test.createTestingModule({
      providers: [
        JobsProcessor,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(() => null),
            getOrThrow: vi.fn((key) => {
              if (key === "AZURE_INPUT_CONTAINER") {
                return "azure-in";
              }
              if (key === "AZURE_OUTPUT_CONTAINER") {
                return "azure-out";
              }
              return "mock";
            }),
          },
        },
        { provide: STORAGE_PROVIDER, useValue: storageProviderMock },
      ],
    }).compile();
    const defaultProcessor = defaultModule.get<JobsProcessor>(JobsProcessor);

    const mockJob = { data: { jobId: "azure-default-job" } } as Job<{ jobId: string }>;
    vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
      createMockJob({ id: "azure-default-job", inputPath: "in.jpg" }),
    ]);
    // biome-ignore lint/suspicious/noExplicitAny: mocking db
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    await defaultProcessor.process(mockJob);

    expect(storageProviderMock.download).toHaveBeenCalledWith("in.jpg", { bucket: "azure-in" });
  });

  describe("Processing Options", () => {
    it("should apply grayscale filter", async () => {
      const mockJob = { data: { jobId: "job-grayscale" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({ id: "job-grayscale", processingOptions: { type: "GRAYSCALE" } }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);
      vi.clearAllMocks();

      const processPromise = processor.process(mockJob);
      await processPromise;

      const sharpInstance = sharp(Buffer.from("mock"));
      expect(sharpInstance.grayscale).toHaveBeenCalled();
    });

    it("should apply blur filter", async () => {
      const mockJob = { data: { jobId: "job-blur" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({ id: "job-blur", processingOptions: { type: "BLUR" } }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      const processPromise = processor.process(mockJob);
      await processPromise;

      const sharpInstance = sharp(Buffer.from("mock"));
      expect(sharpInstance.blur).toHaveBeenCalledWith(10);
    });

    it("should apply resize filter", async () => {
      const mockJob = { data: { jobId: "job-resize" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({ id: "job-resize", processingOptions: { type: "RESIZE" } }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      const processPromise = processor.process(mockJob);
      await processPromise;

      const sharpInstance = sharp(Buffer.from("mock"));
      expect(sharpInstance.resize).toHaveBeenCalledWith(800, 600);
    });

    it("should apply watermark if text is provided", async () => {
      const mockJob = { data: { jobId: "job-watermark" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({
          id: "job-watermark",
          processingOptions: { type: "GRAYSCALE", watermark_text: "Confidential" },
        }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      const processPromise = processor.process(mockJob);
      await processPromise;

      const sharpInstance = sharp(Buffer.from("mock"));
      expect(sharpInstance.composite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            input: expect.any(Buffer),
            gravity: "southeast",
          }),
        ]),
      );
    });

    it("should throw error if processing options are missing", async () => {
      const mockJob = { data: { jobId: "job-no-options" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({ id: "job-no-options", processingOptions: null }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      await expect(processor.process(mockJob)).rejects.toThrow("Processing options not found");
    });

    it("should throw error if job record is not found", async () => {
      const mockJob = { data: { jobId: "non-existent" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([]);

      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      await expect(processor.process(mockJob)).rejects.toThrow("Job record not found");
    });

    it("should throw error if processing type is unknown", async () => {
      const mockJob = { data: { jobId: "job-unknown-type" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({
          id: "job-unknown-type",
          // biome-ignore lint/suspicious/noExplicitAny: testing invalid type
          processingOptions: { type: "UNKNOWN" as any },
        }),
      ]);

      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      await expect(processor.process(mockJob)).rejects.toThrow("Unknown processing type: UNKNOWN");
    }); // ... (other processing options are similar, logic unchanged)
  });

  describe("Storage Errors", () => {
    it("should handle download error", async () => {
      const mockJob = { data: { jobId: "job-download-error" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({ id: "job-download-error" }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      storageProviderMock.download.mockRejectedValueOnce(new Error("Download failure"));

      vi.clearAllMocks();

      await expect(processor.process(mockJob)).rejects.toThrow("Download failure");
    });
  });

  it("should handle non-Error objects thrown in process", async () => {
    const mockJob = {
      data: { jobId: "fail-non-error" },
    } as Job<{ jobId: string }>;

    // Force a non-Error throw by mocking select to throw string
    vi.mocked(db.select().from(jobs).where).mockRejectedValueOnce("Literal string error");

    // biome-ignore lint/suspicious/noExplicitAny: mocking db response
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    await expect(processor.process(mockJob)).rejects.toBe("Literal string error");

    expect(db.update).toHaveBeenCalled();
    const setCalls = vi.mocked(db.update(jobs).set).mock.calls;
    const failedUpdate = setCalls.find((args) => args[0].status === JobStatus.enum.FAILED);
    expect(failedUpdate).toBeDefined();
    expect(failedUpdate![0].error).toBe("Unknown error");
  });

  it("should handle random simulated failure", async () => {
    const mockJob = { data: { jobId: "job-random-fail" } } as Job<{ jobId: string }>;

    vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
      createMockJob({ id: "job-random-fail" }),
    ]);
    // biome-ignore lint/suspicious/noExplicitAny: mocking db
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    // Mock Math.random to trigger failure
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    vi.clearAllMocks();

    const processPromise = processor.process(mockJob);

    // Handle the promise
    await expect(processPromise).rejects.toThrow(
      "Random simulated failure to demonstrate BullMQ retries",
    );

    // Verify status was updated to FAILED in the DB
    const setCalls = vi.mocked(db.update(jobs).set).mock.calls;
    const failedUpdate = setCalls.find((args) => args[0].status === JobStatus.enum.FAILED);
    expect(failedUpdate).toBeDefined();
  });
});
