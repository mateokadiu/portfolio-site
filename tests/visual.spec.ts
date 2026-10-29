import { expect, test } from './fixtures';
import { hydrateAll } from './helpers';

// Visual regression. Baselines are rendered inside the official Playwright
// Docker image (see scripts/visual.sh) so they match CI pixel for pixel.
// Strict: rendering in the pinned image is deterministic, so any changed pixel
// (beyond per-pixel anti-aliasing) fails. Update after an intentional UI change
// with `pnpm test:visual:update`.

const SHOTS = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about/' },
  { name: 'projects', path: '/projects/' },
  { name: 'project-temporal-stripe', path: '/projects/temporal-stripe/' },
  { name: 'project-tax-ledger', path: '/projects/tax-ledger/' },
  { name: 'not-found', path: '/this-page-does-not-exist/' },
  // Build-time OG card (satori + resvg): guards the share preview layout.
  { name: 'og-card', path: '/og/tax-ledger.png' },
];

for (const shot of SHOTS) {
  test(`looks the same: ${shot.name}`, async ({ page }) => {
    await page.goto(shot.path);
    await hydrateAll(page);
    if (shot.path === '/') await expect(page.locator('sk-counter')).toHaveCount(3);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot(`${shot.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      // Live data: GitHub activity and the footer year.
      mask: [page.locator('[data-github-activity]'), page.locator('footer p')],
    });
  });
}
