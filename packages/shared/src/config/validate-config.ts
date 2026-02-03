import type { z } from "zod";

export const validateConfig = <T extends z.ZodType>(
  zodSchema: T,
  configObject: unknown,
): z.infer<T> => {
  const parseResult = zodSchema.safeParse(configObject);
  if (!parseResult.success) {
    const formattedErrors = parseResult.error.issues
      .map((err) => `- ${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(`Configuration validation error:\n${formattedErrors}`);
  }
  return parseResult.data;
};
