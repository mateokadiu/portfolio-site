import { expect, test } from '@playwright/test';

const PROJECTS = [
  'temporal-stripe',
  'webhook-gateway',
  'shadowkit',
  'studybuddy',
  'tax-ledger',
  'grpc-monorepo-starter',
  'ai-trading-copilot',
];

test('homepage renders with hero + bento grid', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Mateo Kadiu/);
  await expect(page.getByRole('main')).toBeVisible();
  const tiles = page.locator('[data-tile]');
  await expect(tiles).toHaveCount(12);
});

for (const slug of PROJECTS) {
  test(`project page renders: ${slug}`, async ({ page }) => {
    const res = await page.goto(`/projects/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(slug);
    await expect(page.getByText(/back to all projects/i)).toBeVisible();
  });
}

test('skip link is keyboard-accessible', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: /skip to content/i });
  await expect(skipLink).toBeFocused();
});
