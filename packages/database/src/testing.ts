import { type Mock, vi } from "vitest";
import type { jobs } from "./schema.js";

// biome-ignore lint/suspicious/noExplicitAny: complex drizzle types are hard to mock explicitly
export const mockDb: any = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
};

export const mockJobs = {
  id: "jobs.id",
  status: "jobs.status",
  inputPath: "jobs.inputPath",
  outputPath: "jobs.outputPath",
  processingOptions: "jobs.processingOptions",
  createdAt: "jobs.createdAt",
  updatedAt: "jobs.updatedAt",
  error: "jobs.error",
};

export const mockEq: Mock = vi.fn();

// This object mimics the structure of the @repo/database entry point
// biome-ignore lint/suspicious/noExplicitAny: complex drizzle types
export const databaseMock: any = {
  db: mockDb,
  jobs: mockJobs,
  eq: mockEq,
};

export const createMockJob = (overrides: Partial<typeof jobs.$inferSelect> = {}) => ({
  id: "mock-job-id",
  status: "QUEUED" as const,
  inputPath: "input/image.jpg",
  outputPath: null,
  processingOptions: { type: "GRAYSCALE" as const },
  createdAt: new Date(),
  updatedAt: new Date(),
  error: null,
  ...overrides,
});
