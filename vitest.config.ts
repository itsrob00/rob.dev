import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, ".scratch/**"],
  },
});
