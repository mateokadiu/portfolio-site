import { test as base, expect } from '@playwright/test';
import { SAMPLE } from '../src/lib/wattslot';

/** The recorded day, shaped like a `GET /v1/prices` response. */
export const SAMPLE_RESPONSE = {
  zone: SAMPLE.zone,
  currency: 'DKK',
  mode: SAMPLE.mode,
  gridCompany: { gln: '5790000705689', name: SAMPLE.company },
  slots: SAMPLE.starts.map((ms, i) => ({
    start: new Date(ms).toISOString(),
    total: SAMPLE.totals[i],
  })),
};

/**
 * The wattslot tile loads today's prices from the live API. Tests answer that
 * request with the recorded day so every run, and every screenshot, is the same.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://wattslot.mateokadiu.com/v1/**', (route) =>
      route.fulfill({ json: SAMPLE_RESPONSE }),
    );
    await use(page);
  },
});

export type { Page } from '@playwright/test';
export { expect };
