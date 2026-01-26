# Async job Queue

This project demonstrates micro-service architecture with an asynchronous job queue using Bun, Fastify, and BullMQ.

## Features

- Fastify server for handling HTTP requests.
- BullMQ for managing job queues.
- Modular structure with separate routes and utilities.

## Getting Started

To install dependencies:

```bash
bun install
```

Create a `.env` file in the root directory. You can use the provided `.env.example` as a template.

```bash
cp .env.example .env
```

To run:

```bash
bun run start
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

> [!NOTE]
> GenAI tools were used to help create this project and documentation.
