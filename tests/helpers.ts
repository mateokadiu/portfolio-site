import { type Page, expect } from '@playwright/test';

/**
 * Scroll the whole page so every `client:visible` island hydrates, then return
 * to the top. Without this, demos below the fold are never exercised.
 */
export async function hydrateAll(page: Page): Promise<void> {
  const pending = page.locator('astro-island[ssr]');
  // Visit each island that hasn't hydrated yet. Fast scrolling can skip past an
  // element between two IntersectionObserver checks, so go one at a time.
  for (let attempt = 0; attempt < 3 && (await pending.count()) > 0; attempt++) {
    await page.evaluate(async () => {
      for (const island of document.querySelectorAll('astro-island[ssr]')) {
        // Islands are `display: contents`; scroll their first rendered child.
        (island.firstElementChild ?? island).scrollIntoView({ block: 'center' });
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    });
  }
  // Islands mark themselves hydrated by dropping the `ssr` attribute.
  await expect(pending).toHaveCount(0, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');
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
