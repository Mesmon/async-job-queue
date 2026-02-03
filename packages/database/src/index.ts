import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./config/index.js";
import * as schema from "./schema.js";

// Export the schema so apps can use it in queries
export * from "./schema.js";

const connectionString = config.databaseUrl;

// Disable prefetch for serverless environments (optional but good practice)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
