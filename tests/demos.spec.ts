import { expect, test } from '@playwright/test';
import { trackErrors } from './helpers';
import { projectPath } from './site-urls';

// Every demo is exercised on its project page (hydrated on idle) with real
// assertions about the behaviour it is meant to show.

let errors: string[];
test.beforeEach(({ page }) => {
  errors = trackErrors(page);
});
test.afterEach(() => {
  expect(errors, errors.join('\n')).toEqual([]);
});

test.describe('temporal-stripe', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(projectPath('temporal-stripe'));
  });

  const state = (page: import('@playwright/test').Page) => page.getByText(/^state ·/);

  test('play walks the scripted lifecycle', async ({ page }) => {
    await expect(state(page)).toContainText('authorized');
    await page.getByRole('button', { name: /play/ }).click();
    await expect(state(page)).toContainText('reauthorizing');
    await expect(page.getByText(/reauth in \d\.\ds/)).toBeVisible();
    await expect(state(page)).toContainText('captured', { timeout: 15_000 });
    await expect(state(page)).toContainText('final');
    await expect(page.getByRole('button', { name: /play/ })).toBeEnabled();
  });

  test('an illegal transition is rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'captured' }).click();
    await expect(state(page)).toContainText('authorized');
  });

  test('play after a manual jump restarts instead of walking from the wrong state', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'canceled' }).click();
    await expect(state(page)).toContainText('canceled');
    await page.getByRole('button', { name: /play/ }).click();
    await expect(state(page)).toContainText('authorized');
    await expect(state(page)).toContainText('reauthorizing');
  });

  test('reset rewinds to authorized', async ({ page }) => {
    await page.getByRole('button', { name: /play/ }).click();
    await expect(state(page)).toContainText('reauthorizing');
    await page.getByRole('button', { name: /reset/ }).click();
    await expect(state(page)).toHaveText('state · authorized');
    await expect(page.getByRole('button', { name: /pause/ })).toBeDisabled();
  });
});

test.describe('tax-ledger', () => {
  test('refunds reverse cent-exact allocations and the books still balance', async ({ page }) => {
    await page.goto(projectPath('tax-ledger'));
    await expect(page.getByText('Σ lines = engine $4.57 ✓ to the cent')).toBeVisible();
    await expect(page.getByText('naive per-line rounding: $4.56 (−1¢ drift)')).toBeVisible();

    await page.getByRole('button', { name: 'refund headphones' }).click();
    await expect(page.getByText('owed $2.44 + refunded $2.13 = $4.57 ✓')).toBeVisible();
    await expect(page.getByRole('button', { name: 'restore headphones' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { name: 'refund cable' }).click();
    await expect(page.getByText('owed $1.34 + refunded $3.23 = $4.57 ✓')).toBeVisible();

    await page.getByRole('button', { name: 'restore headphones' }).click();
    await page.getByRole('button', { name: 'restore cable' }).click();
    await expect(page.getByText('Σ lines = engine $4.57 ✓ to the cent')).toBeVisible();
  });
});

test.describe('webhook-gateway', () => {
  test('retries with backoff, then parks the event in the DLQ', async ({ page }) => {
    await page.goto(projectPath('webhook-gateway'));
    const fire = page.getByRole('button', { name: /fire delivery|next retry/ });
    await fire.click();
    await expect(page.getByText('1st attempt failed — backing off 30s')).toBeVisible();
    for (let i = 0; i < 6; i++) await fire.click();
    await expect(
      page.getByText('parked in DLQ after 6 retries — needs manual replay'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /in DLQ/ })).toBeDisabled();
    await expect(
      page.getByRole('list', { name: 'delivery attempts' }).getByRole('listitem'),
    ).toHaveCount(8);
  });

  test('a healthy downstream delivers on the first try and can be replayed', async ({ page }) => {
    await page.goto(projectPath('webhook-gateway'));
    await page.getByLabel('downstream down').uncheck();
    await page.getByRole('button', { name: /fire delivery/ }).click();
    await expect(page.getByText('delivered on the first try')).toBeVisible();
    await page.getByRole('button', { name: /replay/ }).click();
    await expect(page.getByText('delivered on the first try')).toBeVisible();
  });
});

test.describe('studybuddy', () => {
  test('a day can be inspected with the keyboard', async ({ page }) => {
    await page.goto(projectPath('studybuddy'));
    const heatmap = page.getByRole('application', { name: /review heatmap/i });
    const summary = await page.getByText(/reviews · busiest/).textContent();
    const busiest = summary?.split('busiest ')[1]?.trim() ?? '';

    await heatmap.focus();
    const tooltip = page.locator('p[aria-live="polite"]').filter({ hasText: 'review' });
    await expect(tooltip).toContainText(busiest);
    await page.keyboard.press('ArrowRight');
    await expect(tooltip).not.toContainText(busiest);
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
  });

  test('month labels line up with the cells under them', async ({ page }) => {
    await page.goto(projectPath('studybuddy'));
    await expect(page.getByRole('application').locator('text').first()).toHaveText('Jun');
  });
});

test.describe('stripe-eu-vat-moss', () => {
  test('applies the destination country rate', async ({ page }) => {
    await page.goto(projectPath('stripe-eu-vat-moss'));
    await expect(page.getByText('€119.00')).toBeVisible(); // DE 19%
    await page.getByRole('button', { name: 'FR', exact: true }).click();
    await expect(page.getByText('€120.00')).toBeVisible();
    await page.getByRole('button', { name: 'HU', exact: true }).click();
    await expect(page.getByText('27.0%')).toBeVisible();
    await expect(page.getByText('€127.00')).toBeVisible();
  });
});

test.describe('tide', () => {
  test('switches capture surface', async ({ page }) => {
    await page.goto(projectPath('tide'));
    await page.getByRole('button', { name: 'extension' }).click();
    await expect(page.getByText('mv3 · chrome + firefox')).toBeVisible();
    await page.getByRole('button', { name: 'api' }).click();
    await expect(page.getByText('bearer · POST /v1/articles')).toBeVisible();
  });
});

test.describe('webhook-gateway-admin', () => {
  test('filter pills drive the visible rows', async ({ page }) => {
    await page.goto(projectPath('webhook-gateway-admin'));
    await expect(page.getByText('6 rows')).toBeVisible();
    await page.getByRole('button', { name: 'failed', exact: true }).click();
    await expect(page.getByText('2 rows')).toBeVisible();
    await page.getByRole('button', { name: 'ok', exact: true }).click();
    await expect(page.getByText('3 rows')).toBeVisible();
  });
});

test.describe('grpc-monorepo-starter', () => {
  test('types the proto, then regenerates four clients; replay restarts', async ({ page }) => {
    await page.goto(projectPath('grpc-monorepo-starter'));
    await expect(page.getByText('4 clients regenerated')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('generated', { exact: true })).toHaveCount(4);
    await page.getByRole('button', { name: /replay/ }).click();
    await expect(page.getByText('codegen…')).toBeVisible();
    await expect(page.getByText('4 clients regenerated')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('shadowkit', () => {
  test('the real <sk-counter> works and host CSS cannot reach inside it', async ({ page }) => {
    await page.goto(projectPath('shadowkit'));
    const counter = page.locator('sk-counter').first();
    await expect(page.locator('sk-counter')).toHaveCount(3);
    await counter.getByRole('button', { name: 'increment' }).click();
    await expect(counter.locator('.value')).toHaveText('1');

    const valueColor = () => counter.locator('.value').evaluate((el) => getComputedStyle(el).color);
    const before = await valueColor();
    await page.getByRole('button', { name: /paint every host element/ }).click();
    expect(await valueColor()).toBe(before);
    // ...while the host page itself really was repainted.
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(0, 255, 0)');
  });
});
