import { expect, test } from '@playwright/test';
import { hydrateAll, simulateTranslate, trackErrors } from './helpers';
import { PAGES, projectPath } from './site-urls';

// Page translators (Google Translate, Edge, Safari) rewrite text nodes. React
// islands must be opted out with translate="no", or tiles that hydrate after
// translation throw hydration mismatches and updated text goes stale.

for (const path of PAGES) {
  test(`survives page translation before hydration: ${path}`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path);
    expect(await simulateTranslate(page), 'prose should still be translatable').toBeGreaterThan(10);
    await hydrateAll(page);
    expect(errors, errors.join('\n')).toEqual([]);
    await expect(page.locator('[translate="no"] font')).toHaveCount(0);
  });
}

test('demos keep updating on a translated page', async ({ page }) => {
  await page.goto(projectPath('tide'));
  await hydrateAll(page);
  await simulateTranslate(page);
  await page.getByRole('button', { name: 'extension' }).click();
  await expect(page.getByText('mv3 · chrome + firefox')).toBeVisible();
});
