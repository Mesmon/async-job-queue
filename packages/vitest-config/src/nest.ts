import type { UserConfig } from "vitest/config";
import { config as baseConfig } from "./base.js";

export const nestConfig: UserConfig = {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    environment: "node",
    include: ["**/*.spec.ts"],
    coverage: {
      ...(baseConfig.test?.coverage || {}),
      provider: "v8",
      reportsDirectory: "coverage",
      include: ["**/*.(t|j)s"],
    },
  },
};