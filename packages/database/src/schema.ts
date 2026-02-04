import { JobStatus, type ProcessingOptions } from "@repo/shared/schemas";
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// (Note: Drizzle needs to know about the enum in the DB layer too)
export const jobStatusEnum = pgEnum("job_status", JobStatus.options as [string, ...string[]]);

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),

  status: jobStatusEnum("status").default(JobStatus.enum.QUEUED).notNull(),

  // Path to the image in Azure Blob Storage (Input)
  inputPath: text("input_path").notNull(),

  // Path to the image in Azure Blob Storage (Output) - Nullable until complete
  outputPath: text("output_path"),

  // Processing options stored as JSONB
  processingOptions: jsonb("processing_options").$type<ProcessingOptions | null>(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Error message (if status === FAILED)
  error: text("error"),
});
