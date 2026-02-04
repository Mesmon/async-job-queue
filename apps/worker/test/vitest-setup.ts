import "reflect-metadata";

// Set environment variables required by modules loaded during tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
