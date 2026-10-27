import { type Page, expect } from '@playwright/test';

/**
 * Scroll the whole page so every `client:visible` island hydrates, then return
 * to the top. Without this, demos below the fold are never exercised.
 */
export async function hydrateAll(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => window.innerHeight);
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(80);
  }
  await page.waitForLoadState('networkidle');
  // Islands mark themselves hydrated by dropping the `ssr` attribute.
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await settleAnimations(page);
}

/** Wait until every finite CSS/Web animation (entrances, fades) has finished. */
export async function settleAnimations(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) =>
          a.playState !== 'running' ||
          a.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
      ),
  );
}

/** Collects uncaught errors and console.error calls for the lifetime of the page. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}
