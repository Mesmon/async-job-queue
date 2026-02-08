import { nestConfig } from "@repo/vitest-config/nest";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  // biome-ignore lint/suspicious/noExplicitAny: version mismatch
  nestConfig as any,
  defineConfig({
    plugins: [
      // biome-ignore lint/suspicious/noExplicitAny: type incompatibility
      tsconfigPaths() as any,
      swc.vite({
        tsconfigFile: "./tsconfig.json",
      }),
    ],
    test: {
      setupFiles: ["./test/vitest-setup.ts"],
      coverage: {
        provider: "v8",
        include: ["src/**/*.ts"],
        exclude: ["src/main.ts", "**/*.spec.ts", "**/*.module.ts"],
      },
      server: {
        deps: {
          inline: ["@repo/shared", "@repo/database"],
        },
      },
    },
  }),
);
