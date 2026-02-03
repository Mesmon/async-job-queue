import { nestConfig } from "@repo/vitest-config/nest";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  nestConfig,
  defineConfig({
    plugins: [
      tsconfigPaths(),
      swc.vite({
        tsconfigFile: "./tsconfig.json",
      }),
    ],
    test: {
      setupFiles: ["./test/vitest-setup.ts"],
      server: {
        deps: {
          inline: ["@repo/shared", "@repo/database"],
        },
      },
    },
  }),
);
