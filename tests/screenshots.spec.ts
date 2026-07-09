import { test } from '@playwright/test';
import { projectPath } from './site-urls';

test('homepage screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 800)));
  await page.screenshot({ path: 'docs/screenshots/home.png', fullPage: false });
});

test('temporal-stripe page screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(projectPath('temporal-stripe'));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 800)));
  await page.screenshot({ path: 'docs/screenshots/temporal-stripe.png', fullPage: false });
});

test('tax-ledger page screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(projectPath('tax-ledger'));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 800)));
  await page.screenshot({ path: 'docs/screenshots/tax-ledger.png', fullPage: false });
});
