# Async Job Queue - Image Processor

A high-performance, scalable asynchronous job queue for image processing, built with a modern TypeScript monorepo architecture.

![Coverage API](https://img.shields.io/badge/Coverage%20(API)-100%25-brightgreen)
![Coverage Worker](https://img.shields.io/badge/Coverage%20(Worker)-100%25-brightgreen)
![Linting](https://img.shields.io/badge/Linting-Biome-blue)
![Types](https://img.shields.io/badge/TypeScript-Strict-blue)

## 🚀 Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/) (Fast, efficient management)
- **Package Manager**: [pnpm](https://pnpm.io/) (Strict, fast dependency management)
- **Backend**: [NestJS](https://nestjs.com/) (Modular, scalable architecture)
- **Frontend**: [Next.js](https://nextjs.org/) (React framework with App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Queue**: [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)
- **Storage**: [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) (with [Azurite](https://github.com/Azure/Azurite) for local dev)
- **Quality**: [Vitest](https://vitest.dev/) (Testing) & [Biome](https://biomejs.dev/) (Linting/Formatting)

## 📁 Project Structure

```plaintext
/
├── apps/
│   ├── api/          # NestJS HTTP Server (Job Producer)
│   ├── worker/       # NestJS Standalone Worker (Job Consumer)
│   └── web/          # Next.js Frontend (Job Monitoring UI)
├── packages/
│   ├── database/     # Shared Drizzle schema, config & centralized mocks
│   ├── shared/       # Shared Zod schemas & business logic types
│   ├── ui/           # Shared React components (Shadcn/UI)
│   ├── vitest-config/ # Internal Vitest presets
│   └── typescript-config/ # Internal TS configurations
├── docker-compose.yml # Infrastructure (Postgres, Redis, Azurite)
└── TESTS.md          # Detailed testing documentation
```

## 🛠️ Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- pnpm `^10.0.0`
- Node.js `^18.0.0`

### 2. Infrastructure
Spin up the required services (PostgreSQL, Redis, Azurite):
```bash
docker-compose up -d
```

### 3. Install & Build
```bash
pnpm install
turbo build
```

### 4. Development
```bash
turbo dev
```

## 🧪 Testing & Quality

Maintaining a rigorous quality standard with **100% code coverage** in critical service paths.

- **Run all tests**: `turbo test`
- **Type Check**: `turbo run check-types`
- **Lint & Format**: `turbo run format-and-lint:fix`

## 🏗️ Architecture Highlights

### Type-Safe Boundaries
We share Zod schemas between the **API**, **Worker**, and **Web** via the `@repo/shared` package. This ensures that a schema change in one place immediately notifies the entire system of breaking changes during build time.

### Centralized Testing Infrastructure
Database mocks and factories are centralized in `@repo/database/testing`. This allows every app to test against a consistent, high-fidelity mock of our data layer, reducing boilerplate and preventing divergent mock behavior.

### Scalable Background Processing
The system uses the **Producer-Consumer** pattern. The API validates requests and emits small payloads (just the `jobId`) to BullMQ. The Worker independently fetches full metadata from the database, processes the image using `sharp` and a virtual delay (for demonstration purposes), and updates the state, ensuring the API remains fast and responsive.
