import { nestConfig } from "@repo/vitest-config/nest";
import swc from "unplugin-swc";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  nestConfig,
  defineConfig({
    plugins: [
      swc.vite({
        tsconfigFile: "./tsconfig.json",
      }),
    ],
    test: {
      setupFiles: ["./test/vitest-setup.ts"],
    },
  }),
);
