import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const CI = !!process.env.CI;
// Visual baselines only exist for the Linux Playwright image; run them through
// `pnpm test:visual` (Docker) locally, or in the CI container.
const VISUAL = process.env.PW_VISUAL === '1';
const PORT = 4321;

const functional = [
  '**/smoke.spec.ts',
  '**/demos.spec.ts',
  '**/audit.spec.ts',
  '**/a11y.spec.ts',
  '**/translate.spec.ts',
];

const projects: PlaywrightTestConfig['projects'] = [
  { name: 'desktop', testMatch: functional, use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile', testMatch: functional, use: { ...devices['Pixel 7'] } },
];

if (VISUAL) {
  // Reduced motion freezes every demo in its settled state.
  // (`contextOptions` — the top-level `reducedMotion` fixture isn't applied in this setup.)
  const visual = {
    testMatch: '**/visual.spec.ts',
    use: { contextOptions: { reducedMotion: 'reduce' as const } },
  };
  projects.push(
    { name: 'visual-desktop', ...visual, use: { ...devices['Desktop Chrome'], ...visual.use } },
    { name: 'visual-mobile', ...visual, use: { ...devices['Pixel 7'], ...visual.use } },
  );
}

if (process.env.PW_README === '1') {
  projects.push({
    name: 'readme',
    testMatch: '**/screenshots.spec.ts',
    use: devices['Desktop Chrome'],
  });
}

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects,
  webServer: {
    // Serves the built dist/ like Cloudflare Pages (run `pnpm build` first).
    command: 'node tests/serve.mjs dist',
    url: `http://localhost:${PORT}/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
});
