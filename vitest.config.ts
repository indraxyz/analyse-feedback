import { defineConfig } from "vitest/config";
import { resolve } from "path";
import type { UserConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
} satisfies UserConfig);
