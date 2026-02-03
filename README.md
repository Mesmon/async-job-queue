1. The Tech Stack Selection ("The Right Way")
Repository: Turborepo (Fast, efficient monorepo management).

Package Manager: pnpm (Strict dependency management, faster than npm/yarn).

Backend Framework: NestJS (The standard for scalable Node.js architectures. Excellent dependency injection and modularity).

Database ORM: Drizzle ORM (Lighter, faster, and more SQL-like than Prisma. Currently the "modern" choice).

Database: PostgreSQL.

Queue: BullMQ + Redis.

Frontend: React + Vite + TanStack Query (For managing async state/polling) + Shadcn/UI (Modern, accessible components).

Validation: Zod (Shared schema validation for both frontend forms and backend DTOs).

Phase 1: The Foundation (Monorepo Setup)
We start by creating a shared environment.

Initialize Turborepo:

Create apps/web (Frontend).

Create apps/api (The HTTP Server).

Create apps/worker (The Background Processor).

Create packages/shared (The secret weapon).

Define Shared Schemas (packages/shared):

Why: We define the "Job" shape once. The API uses it to validate input, the Worker uses it to read the queue, and the Frontend uses it for form validation.

Action: Create a Zod schema for CreateJobRequest (contains prompt, imageExtension) and JobStatusEnum (QUEUED, PROCESSING, COMPLETED, FAILED).

Phase 2: Infrastructure & Data Modeling
Before writing business logic, we define the data structure.

Docker Compose (Local Dev):

Create a docker-compose.yml at the root spinning up PostgreSQL, Redis, and Azurite (Local Azure Storage emulator).

Tip: Don't develop against real Azure cloud resources if you can avoid it. Azurite is faster and free.

Schema Definition (Drizzle):

Define the Jobs table:

TypeScript
// schema.ts
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: text('status').notNull().default('QUEUED'), // Enum in app logic
  inputPath: text('input_path').notNull(),
  outputPath: text('output_path'),
  prompt: text('prompt').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
Run migrations to create the tables in Postgres.

Phase 3: The API Service (apps/api)
This service is the traffic controller. It should be stateless and fast.

Module Structure:

UploadModule: Handles SAS token generation.

JobsModule: Handles job creation and status checks.

Step A: The SAS Token Endpoint:

Use @azure/storage-blob SDK.

Create an endpoint GET /upload/token.

Generate a BlobSASSignatureValues with Write permission only, expiring in 10 minutes.

Return the SAS URL to the frontend.

Step B: The Job Producer:

Import BullModule from @nestjs/bullmq.

Endpoint POST /jobs:

Validate body using the Zod schema from packages/shared.

Insert a new row into Postgres (status: QUEUED).

Inject the queue: await this.jobsQueue.add('transcode', { jobId: newJob.id }).

Crucial: Only send the jobId to the queue. Keep the payload small. The worker will fetch the rest from the DB.

Phase 4: The Worker Service (apps/worker)
This is the heavy lifter.

Setup:

This is also a NestJS app, but it doesn't listen on an HTTP port (standalone application).

It strictly connects to Redis.

The Processor:

Create a class decorated with @Processor('image-queue').

Implement the @Process('transcode') method.

Logic Flow (The "Right" Way):

Fetch: db.select().from(jobs).where(eq(jobs.id, job.data.jobId)).

Lock: Update DB status to PROCESSING.

Stream: Use axios or fetch to get the image stream from the Azure (or Azurite) URL.

Inference: POST the stream + prompt to Hugging Face API.

Upload: Pipe the result buffer directly back to Azure Storage (outputs container).

Complete: Update DB status to COMPLETED and save the outputPath.

Resiliency:

Wrap the logic in try/catch. On error, update DB to FAILED and record the error message.

Phase 5: The Frontend (apps/web)
State Management:

Use TanStack Query (React Query). This is essential for handling the "Polling" mechanism.

The Upload Hook:

Don't write raw fetch calls. Create a custom hook useImageUpload:

Call API to get SAS Token.

Use azure-storage-blob browser SDK (or a simple PUT request) to upload the file.

On success, call API POST /jobs.

The Polling Component:

Once a Job ID is returned, mount a component that queries GET /jobs/:id every 2 seconds.

TanStack Query Setting: refetchInterval: (data) => data.status === 'COMPLETED' ? false : 2000.

Once status is COMPLETED, display the image from the Azure URL.

Visual Guide: Folder Structure
To help you visualize the Monorepo structure, here is how the files should be organized:

Plaintext
/my-ai-project
├── package.json
├── turbo.json
├── docker-compose.yml       <-- Redis, Postgres, Azurite
├── packages/
│   ├── db/                  <-- Shared Drizzle config & schema
│   ├── shared/              <-- Shared Zod schemas & Types
│   └── ui/                  <-- Shared React components (Shadcn)
├── apps/
│   ├── web/                 <-- React + Vite
│   │   ├── src/hooks/use-polling.ts
│   │   └── src/components/upload-form.tsx
│   ├── api/                 <-- NestJS HTTP Server
│   │   ├── src/jobs/jobs.controller.ts
│   │   └── src/upload/upload.service.ts
│   └── worker/              <-- NestJS Worker
│       └── src/job.processor.ts
What makes this the "Right" way?
Type Safety across boundaries: If you change the Job status enum in packages/shared, the Frontend, API, and Worker will all fail to build immediately. You catch bugs at compile time, not runtime.

Separation of Concerns: The API is fast and responsive. The Worker handles the slow, error-prone tasks.

Observable State: Because we use a DB for job status (not just Redis), we can run analytics later (e.g., "Average generation time") and the user can refresh the page without losing their job progress.

Developer Experience: Docker compose means a new developer can run docker-compose up and pnpm dev and have the entire cloud architecture running locally on their laptop.