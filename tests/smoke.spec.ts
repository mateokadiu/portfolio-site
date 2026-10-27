import { expect, test } from '@playwright/test';
import { PROJECT_SLUGS, UTILITY_TILE_COUNT, projectPath } from './site-urls';

test('homepage renders with hero + bento grid', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Mateo Kadiu/);
  await expect(page.getByRole('main')).toBeVisible();
  const tiles = page.locator('[data-tile]');
  await expect(tiles).toHaveCount(PROJECT_SLUGS.length + UTILITY_TILE_COUNT);
});

for (const slug of PROJECT_SLUGS) {
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
