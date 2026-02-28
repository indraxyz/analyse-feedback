import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["ecosystem.config.cjs"],
    languageOptions: {
      parserOptions: {
        project: null,
      },
      globals: {
        __dirname: "readonly",
        module: "readonly",
      },
    },
  },
);
