import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { hydrateAll } from './helpers';
import { PAGES } from './site-urls';

// WCAG 2.2 AA plus axe best practices, on every page, after every demo has
// hydrated — runs in both the desktop and the mobile project.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

for (const path of [...PAGES, '/this-page-does-not-exist/']) {
  test(`no axe violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    await hydrateAll(page);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const report = violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
    );
    expect(report, report.join('\n\n')).toEqual([]);
  });
}
