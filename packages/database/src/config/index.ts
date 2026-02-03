import { validateConfig } from "@repo/shared";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
});

const parsedEnv = validateConfig(envSchema, process.env);

export const configSchema = z.object({
  databaseUrl: z.url("Database URL must be a valid URL"),
});

export type Config = z.infer<typeof configSchema>;

export const config: Config = {
  databaseUrl: parsedEnv.DATABASE_URL,
};
