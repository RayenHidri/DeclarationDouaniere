import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  webServer: {
    // Build + start ensures we run tests against the production (no HMR) server in CI
    command: 'npm run build && npm run start',
    port: 3001,
    timeout: 120_000,
    // locally reuse an existing server (developer convenience). In CI, this evaluates to false so Playwright starts the server.
    reuseExistingServer: !process.env.CI,
  },
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    ignoreHTTPSErrors: true,
    actionTimeout: 10 * 1000,
  },
});
