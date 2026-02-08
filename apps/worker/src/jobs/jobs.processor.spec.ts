import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { db, jobs } from "@repo/database";
import { JobStatus } from "@repo/shared";
import type { Job } from "bullmq";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobsProcessor } from "./jobs.processor.js";

const { databaseMock, createMockJob } = await vi.hoisted(() => import("@repo/database/testing"));

// Mock @repo/database using the centralized testing mock
vi.mock("@repo/database", () => databaseMock);

// Mock Azure SDK
vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn().mockReturnValue({
      getContainerClient: vi.fn().mockReturnValue({
        createIfNotExists: vi.fn(),
        getBlockBlobClient: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({
            readableStreamBody: {
              on: vi.fn((event, callback) => {
                if (event === "data") {
                  callback(Buffer.from("mock-data"));
                }
                if (event === "end") {
                  callback();
                }
                return this;
              }),
            },
          }),
          upload: vi.fn(),
        }),
      }),
    }),
  },
}));

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

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Mock Math.random to be deterministic (success by default)
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    // Mock Logger to silence output
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsProcessor,
        {
          provide: ConfigService,
          useValue: {
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
      ],
    }).compile();

    processor = module.get<JobsProcessor>(JobsProcessor);

    // Default mocks setup
    vi.mocked(db.update(jobs).set).mockReturnThis();
  });

  afterEach(() => {
    vi.useRealTimers();
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
      createMockJob({ id: "test-job-id" }),
    ]);

    // Mock Update Where to return something
    // biome-ignore lint/suspicious/noExplicitAny: mocking db response
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    vi.clearAllMocks();

    const processPromise = processor.process(mockJob);

    // Fast forward time to skip the 5s delay
    await vi.advanceTimersByTimeAsync(5000);

    await processPromise;

    // Verify DB update calls
    // 1. Status PROCESSING
    expect(db.update).toHaveBeenCalled();
    // 2. Status COMPLETED
    expect(db.update).toHaveBeenCalledTimes(2);

    // Verify Sharp called
    expect(sharp).toHaveBeenCalled();
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
      await vi.advanceTimersByTimeAsync(5000);
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
      vi.clearAllMocks();

      const processPromise = processor.process(mockJob);
      await vi.advanceTimersByTimeAsync(5000);
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
      vi.clearAllMocks();

      const processPromise = processor.process(mockJob);
      await vi.advanceTimersByTimeAsync(5000);
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
      vi.clearAllMocks();

      const processPromise = processor.process(mockJob);
      await vi.advanceTimersByTimeAsync(5000);
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
      vi.clearAllMocks();

      await expect(processor.process(mockJob)).rejects.toThrow("Processing options not found");
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
      vi.clearAllMocks();

      await expect(processor.process(mockJob)).rejects.toThrow("Unknown processing type: UNKNOWN");
    });
  });

  describe("Stream Helpers", () => {
    it("should handle stream errors in streamToBuffer", async () => {
      const mockJob = { data: { jobId: "job-stream-error" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({ id: "job-stream-error" }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      // Mock stream error
      vi.mocked(
        // biome-ignore lint/suspicious/noExplicitAny: internal azure mock
        (processor as any).blobServiceClient.getContainerClient("").getBlockBlobClient("").download,
      ).mockResolvedValueOnce({
        readableStreamBody: {
          on: vi.fn((event, callback) => {
            if (event === "error") {
              callback(new Error("Stream failure"));
            }
            return this;
          }),
        },
        // biome-ignore lint/suspicious/noExplicitAny: internal azure mock
      } as any);

      vi.clearAllMocks();

      await expect(processor.process(mockJob)).rejects.toThrow("Stream failure");
    });

    it("should handle string data in streamToBuffer", async () => {
      const mockJob = { data: { jobId: "job-string-stream" } } as Job<{ jobId: string }>;

      vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([
        createMockJob({ id: "job-string-stream" }),
      ]);
      // biome-ignore lint/suspicious/noExplicitAny: mocking db
      vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

      // Mock stream with string data
      vi.mocked(
        // biome-ignore lint/suspicious/noExplicitAny: internal azure mock
        (processor as any).blobServiceClient.getContainerClient("").getBlockBlobClient("").download,
      ).mockResolvedValueOnce({
        readableStreamBody: {
          on: vi.fn((event, callback) => {
            if (event === "data") {
              callback("string-data");
            }
            if (event === "end") {
              callback();
            }
            return this;
          }),
        },
        // biome-ignore lint/suspicious/noExplicitAny: internal azure mock
      } as any);

      vi.clearAllMocks();

      const processPromise = processor.process(mockJob);
      await vi.advanceTimersByTimeAsync(5000);
      await processPromise;

      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });

  it("should handle errors and update job status to FAILED", async () => {
    const mockJob = {
      data: { jobId: "fail-job-id" },
    } as Job<{ jobId: string }>;

    // Mock DB select to return empty, causing "Job record not found"
    vi.mocked(db.select().from(jobs).where).mockResolvedValueOnce([]);

    // biome-ignore lint/suspicious/noExplicitAny: mocking db response
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    vi.clearAllMocks();

    await expect(processor.process(mockJob)).rejects.toThrow("Job record not found");

    // Verify DB update status FAILED
    expect(db.update).toHaveBeenCalled();
    const setCalls = vi.mocked(db.update(jobs).set).mock.calls;
    const failedUpdate = setCalls.find((args) => args[0].status === JobStatus.enum.FAILED);
    expect(failedUpdate).toBeDefined();
    expect(failedUpdate![0].error).toBe("Job record not found");
  });

  it("should handle non-Error objects thrown in process", async () => {
    const mockJob = {
      data: { jobId: "fail-non-error" },
    } as Job<{ jobId: string }>;

    // Force a non-Error throw by mocking select to throw string
    vi.mocked(db.select().from(jobs).where).mockRejectedValueOnce("Literal string error");

    // biome-ignore lint/suspicious/noExplicitAny: mocking db response
    vi.mocked(db.update(jobs).set({}).where).mockResolvedValue({} as any);

    vi.clearAllMocks();

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

    // Handle the promise before advancing timers
    const expectation = expect(processPromise).rejects.toThrow(
      "Random simulated failure to demonstrate BullMQ retries",
    );

    await vi.runAllTimersAsync();
    await expectation;

    // Verify status was updated to FAILED in the DB
    const setCalls = vi.mocked(db.update(jobs).set).mock.calls;
    const failedUpdate = setCalls.find((args) => args[0].status === JobStatus.enum.FAILED);
    expect(failedUpdate).toBeDefined();
  });
});
