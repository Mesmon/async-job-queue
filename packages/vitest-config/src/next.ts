import type { UserConfig } from "vitest/config";
import { config as baseConfig } from "./base.js";

export const nextConfig: UserConfig = {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    environment: "jsdom",
  },
};
