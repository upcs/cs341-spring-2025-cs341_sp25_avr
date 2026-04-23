import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.JPG", "**/*.jpg", "**/*.jpeg", "**/*.png"],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/App.tsx",
        "src/components/LoginGate.tsx",
        "src/components/auth-context.tsx",
        "src/data/buildings.ts",
        "src/data/geoTable.ts",
        "src/lib/auth-client.ts",
        "src/lib/backend-status.ts",
        "src/pages/Index.tsx",
        "src/pages/NotFound.tsx",
        "src/store/appStore.ts",
      ],
      exclude: [
        "dist/**",
        "node_modules/**",
        "src/test/**",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
