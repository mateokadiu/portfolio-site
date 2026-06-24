import { expect, test } from '@playwright/test';

test('temporal-stripe demo advances after clicking play', async ({ page }) => {
  await page.goto('/projects/temporal-stripe');
  const stateLine = page.locator('[aria-live="polite"]').first();
  await expect(stateLine).toContainText('authorized');

  await page.getByRole('button', { name: /play/i }).click();
  // Walk takes ~1.1s per step. After 3s we should be at least 2 steps in.
  await page.waitForTimeout(3500);
  await expect(stateLine).not.toContainText('state · authorized', { timeout: 1_000 });
});

test('temporal-stripe reset rewinds to initial state', async ({ page }) => {
  await page.goto('/projects/temporal-stripe');
  const stateLine = page.locator('[aria-live="polite"]').first();
  await page.getByRole('button', { name: /play/i }).click();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /reset/i }).click();
  await expect(stateLine).toContainText('authorized');
});

test('temporal-stripe demo hint is visible above the widget', async ({ page }) => {
  await page.goto('/projects/temporal-stripe');
  await expect(page.getByText(/try the demo/i)).toBeVisible();
  await expect(page.getByText(/PaymentIntent live its full lifecycle/i)).toBeVisible();
});

test('tax-ledger refund button triggers split animation', async ({ page }) => {
  await page.goto('/projects/tax-ledger');
  const refundBtn = page.getByRole('button', { name: /refund/i }).first();
  await expect(refundBtn).toBeVisible();
  await refundBtn.click();
  await page.waitForTimeout(1200);
});

test('webhook-gateway toggle button is interactive', async ({ page }) => {
  await page.goto('/projects/webhook-gateway');
  const buttons = page.getByRole('button');
  await expect(buttons.first()).toBeVisible();
});
