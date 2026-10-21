import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:5179' },
  webServer: {
    command: 'npx vite --port 5179 --strictPort',
    url: 'http://localhost:5179',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Exports must match across browsers; snapshots stay Chromium-only.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /export\.spec\.ts/ },
  ],
});
