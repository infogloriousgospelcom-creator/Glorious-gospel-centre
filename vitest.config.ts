import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist", ".vercel"],
    coverage: {
      enabled: false,
    },
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Stub the server/client-only sentinels so unit tests can import
      // server-only utility modules.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
      "client-only": path.resolve(__dirname, "tests/stubs/client-only.ts"),
    },
  },
});