import { expect, test } from '@playwright/test';
import { projectPath } from './site-urls';

const PROJECTS = [
  'temporal-stripe',
  'webhook-gateway',
  'webhook-gateway-admin',
  'shadowkit',
  'tax-ledger',
  'grpc-monorepo-starter',
  'stripe-eu-vat-moss',
  'tide',
  'studybuddy',
];

test('homepage renders with hero + bento grid', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Mateo Kadiu/);
  await expect(page.getByRole('main')).toBeVisible();
  const tiles = page.locator('[data-tile]');
  await expect(tiles).toHaveCount(14);
});

for (const slug of PROJECTS) {
  test(`project page renders: ${slug}`, async ({ page }) => {
    const res = await page.goto(projectPath(slug));
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
