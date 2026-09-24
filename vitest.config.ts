import { defineConfig } from "vitest/config";
import path from "path";

process.env.DATABASE_URL = "file:./dev.db";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
