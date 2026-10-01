import { defineConfig, devices } from '@playwright/test';

// Locally the tests use the Microsoft Edge that is already installed (no browser download).
// In CI, PW_CHANNEL is left unset and Playwright's own Chromium is used.
const channel = process.env.CI ? undefined : 'msedge';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
  ],
  webServer: {
    command: 'bun run build && bun run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
