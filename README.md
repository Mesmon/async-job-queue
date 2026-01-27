# Distributed Image Processing Service

A scalable, asynchronous microservice for image processing, designed with **Fastify**, **BullMQ**, and **Redis**.

## 🏗 Architecture
- **API Service**: Fastify server handling HTTP requests and schema validation.
- **Message Broker**: Redis-backed BullMQ for robust job management.
- **Worker Service**: Scalable worker nodes performing CPU-intensive image resizing (using `sharp`).
- **Observability**: Integrated Bull Board for real-time queue monitoring.

## 🚀 Features
- **Asynchronous Processing**: Offloads heavy computation to background workers.
- **Reliability**: Automatic retries and exponential backoff for failed jobs.
- **Scalability**: Dockerized services allow independent scaling of Workers vs API.
- **Safety**: comprehensive Type-Safety with TypeScript and Zod schema validation.

## 🛠 Usage

### 1. Start System (Docker)
Spins up Redis, API, and 2 Worker replicas.
```bash
docker-compose up --build