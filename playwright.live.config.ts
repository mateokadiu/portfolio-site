import { defineConfig, devices } from '@playwright/test';

// Post-deploy check against production: `pnpm test:live`.
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/smoke.spec.ts', '**/audit.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  use: { baseURL: 'https://mateokadiu.com', trace: 'off' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
});
