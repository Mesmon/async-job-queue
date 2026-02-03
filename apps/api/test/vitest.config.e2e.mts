import { nestConfig } from "@repo/vitest-config/dist/nest.js";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...nestConfig,
  plugins: [
    swc.vite({
      tsconfigFile: "./tsconfig.json",
    }),
  ],
  test: {
    ...nestConfig.test,
    include: ["**/*.e2e-spec.ts"],
    root: ".",
    setupFiles: ["./test/vitest-setup.ts"],
  },
});
