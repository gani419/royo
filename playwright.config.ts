import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 3,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command:
        "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort",
      cwd: path.resolve("apps/web"),
      url: "http://127.0.0.1:5174",
      reuseExistingServer: !process.env.CI,
      env: { ROYO_API_PROXY_URL: "http://127.0.0.1:18080" },
    },
    {
      command:
        process.platform === "win32"
          ? '"C:/Program Files/Go/bin/go.exe" run ./cmd/server'
          : "go run ./cmd/server",
      cwd: path.resolve("backend"),
      url: "http://127.0.0.1:18080/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 90000,
      env: {
        APP_ENV: "development",
        PORT: "18080",
        DATABASE_URL: "",
        GEMINI_API_KEY: "",
        YOUTUBE_API_KEY: "",
        JWT_SECRET: "test-only-signing-key-32-characters-long",
        CORS_ALLOWED_ORIGINS: "http://127.0.0.1:5174",
      },
    },
  ],
});
