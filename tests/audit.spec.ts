import { expect, test } from '@playwright/test';
import { PROJECTS_WITH_DEMO_HINTS, projectPath } from './site-urls';

const PAGES = [
  '/',
  '/about/',
  '/projects/temporal-stripe/',
  '/projects/webhook-gateway/',
  '/projects/webhook-gateway-admin/',
  '/projects/shadowkit/',
  '/projects/studybuddy/',
  '/projects/tax-ledger/',
  '/projects/grpc-monorepo-starter/',
  '/projects/stripe-eu-vat-moss/',
  '/projects/tide/',
];

const STATIC_ASSETS = [
  '/og/default.png',
  '/og/about.png',
  '/og/temporal-stripe.png',
  '/og/webhook-gateway.png',
  '/og/shadowkit.png',
  '/og/studybuddy.png',
  '/og/tax-ledger.png',
  '/og/grpc-monorepo-starter.png',
  '/og/tide.png',
  '/og/webhook-gateway-admin.png',
  '/og/stripe-eu-vat-moss.png',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap-index.xml',
];

for (const path of PAGES) {
  test(`page returns 200: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    });
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    expect(errors, `errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
  });
}

for (const asset of STATIC_ASSETS) {
  test(`static asset 200: ${asset}`, async ({ request }) => {
    const res = await request.get(asset);
    expect(res.status(), `asset ${asset}`).toBe(200);
  });
}

test('homepage has full SEO meta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /senior full-stack/i,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mateokadiu.com/',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\.png$/);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test('homepage has Person + WebSite + ItemList JSON-LD without duplicates', async ({ page }) => {
  await page.goto('/');
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = scripts.map((s) => JSON.parse(s)['@type']);
  expect(types.filter((t) => t === 'Person')).toHaveLength(1);
  expect(types.filter((t) => t === 'WebSite')).toHaveLength(1);
  expect(types).toContain('ItemList');
});

test('about page canonical uses trailing slash', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mateokadiu.com/about/',
  );
});

test('project page has article meta + SoftwareSourceCode JSON-LD', async ({ page }) => {
  await page.goto('/projects/temporal-stripe/');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="article:author"]')).toHaveAttribute(
    'content',
    'Mateo Kadiu',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mateokadiu.com/projects/temporal-stripe/',
  );
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = scripts.map((s) => JSON.parse(s)['@type']);
  expect(types).toContain('SoftwareSourceCode');
  expect(types).toContain('BreadcrumbList');
});

test('sitemap lists all indexable pages', async ({ request }) => {
  const idx = await (await request.get('/sitemap-index.xml')).text();
  expect(idx).toContain('sitemap-0.xml');
  const m = await (await request.get('/sitemap-0.xml')).text();
  for (const p of PAGES) {
    const absolute = p === '/' ? 'https://mateokadiu.com/' : `https://mateokadiu.com${p}`;
    expect(m).toContain(absolute);
  }
  expect(m).not.toContain('/embeds/');
});

test('robots.txt allows crawl, blocks embeds, links sitemap', async ({ request }) => {
  const r = await (await request.get('/robots.txt')).text();
  expect(r).toMatch(/User-agent:\s*\*/);
  expect(r).toMatch(/Allow:\s*\//);
  expect(r).toMatch(/Disallow:\s*\/embeds\//);
  expect(r).toMatch(/Sitemap:.+sitemap-index\.xml/);
});

test('manifest has icons + theme color', async ({ request }) => {
  const m = await (await request.get('/manifest.webmanifest')).json();
  expect(m.name).toMatch(/Mateo Kadiu/);
  expect(m.icons.length).toBeGreaterThanOrEqual(3);
  expect(m.theme_color).toMatch(/#/);
  expect(m.start_url).toBe('/');
});

test('internal nav links use trailing slashes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'about' })).toHaveAttribute(
    'href',
    '/about/',
  );
});

test('temporal-stripe live demo: play advances, reauth ring renders cleanly', async ({ page }) => {
  await page.goto('/projects/temporal-stripe/');
  const state = page.locator('[aria-live="polite"]').first();
  await expect(state).toContainText('authorized');
  await page.getByRole('button', { name: /play/i }).click();
  await page.waitForTimeout(3500);
  await expect(state).not.toContainText('state · authorized', { timeout: 2000 });
});

test('homepage hero copy is the new version', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Every tile below is a project I shipped/i)).toBeVisible();
});

for (const slug of PROJECTS_WITH_DEMO_HINTS) {
  test(`demo hint shows on project page: ${slug}`, async ({ page }) => {
    await page.goto(projectPath(slug));
    await expect(page.getByText(/try the demo/i)).toBeVisible();
  });
}
