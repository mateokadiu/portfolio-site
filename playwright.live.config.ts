import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/interactive.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { baseURL: 'https://mateokadiu.pages.dev', trace: 'off' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
});
