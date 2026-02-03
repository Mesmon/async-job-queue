import type { UserConfig } from "vitest/config";

export const config: UserConfig = {
  test: {
    coverage: {
      enabled: true,
      provider: "v8",
      reportsDirectory: "coverage",
    },
    environment: "jsdom",
  },
};