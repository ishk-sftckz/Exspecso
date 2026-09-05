import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [
      "tests/integration/containment-races.test.ts",
      "tests/integration/init-codex-tracer.test.ts",
      "tests/integration/validation-errors.test.ts",
      "tests/unit/contained-fs.test.ts",
      "tests/unit/containment-evidence.test.ts",
      "tests/unit/containment-support.test.ts",
    ],
  },
});
