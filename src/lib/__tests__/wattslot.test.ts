import { describe, expect, it } from 'vitest';
import {
  cheapestWindow,
  clock,
  copenhagenDate,
  dayLabel,
  levels,
  parsePrices,
  pricesUrl,
  SAMPLE,
  slotAt,
} from '../wattslot';

const QUARTER = 15 * 60_000;

describe('wattslot sample day', () => {
  it('covers 28 October 2026 in Copenhagen, one quarter hour per bar', () => {
    expect(SAMPLE.starts).toHaveLength(96);
    expect(SAMPLE.totals).toHaveLength(96);
    expect(clock(SAMPLE.starts[0]!)).toBe('00:00');
    expect(clock(SAMPLE.starts[95]!)).toBe('23:45');
    expect(dayLabel(SAMPLE.starts[0]!)).toBe('Wed 28 Oct');
  });

  it('peaks at 18:00 at 4.35 DKK/kWh, as on wattslot.mateokadiu.com', () => {
    const peak = SAMPLE.totals.indexOf(Math.max(...SAMPLE.totals));
    expect(clock(SAMPLE.starts[peak]!)).toBe('18:00');
    expect(SAMPLE.totals[peak]!.toFixed(2)).toBe('4.35');
  });
});

describe('levels', () => {
  it('splits the day into thirds', () => {
    const tiers = levels(SAMPLE.totals);
    const count = (l: string) => tiers.filter((t) => t === l).length;
    expect(count('cheap')).toBe(32);
    expect(count('expensive')).toBe(32);
    expect(count('normal')).toBe(32);
  });

  it('calls a flat day normal', () => {
    expect(levels([2, 2, 2])).toEqual(['normal', 'normal', 'normal']);
  });
});

describe('cheapestWindow', () => {
  it('finds the cheapest two hours of the sample', () => {
    const best = cheapestWindow(SAMPLE, 8);
    expect(best?.from).toBe(0);
    expect(best?.average).toBeCloseTo(1.7048, 4);
  });

  it('matches brute force on random days', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const totals = Array.from({ length: 40 }, (_, i) => ((seed * 7919 + i * 104729) % 97) / 10);
      const day = { ...SAMPLE, starts: totals.map((_, i) => i * QUARTER), totals };
      let bestAvg = Number.POSITIVE_INFINITY;
      let bestFrom = -1;
      for (let from = 0; from + 5 <= totals.length; from++) {
        const avg = totals.slice(from, from + 5).reduce((a, b) => a + b, 0) / 5;
        if (avg < bestAvg - 1e-12) {
          bestAvg = avg;
          bestFrom = from;
        }
      }
      expect(cheapestWindow(day, 5)?.from).toBe(bestFrom);
    }
  });

  it('never spans a gap in the data', () => {
    const day = { ...SAMPLE, starts: [0, QUARTER, 3 * QUARTER, 4 * QUARTER], totals: [1, 1, 5, 5] };
    expect(cheapestWindow(day, 3)).toBeNull();
    expect(cheapestWindow(day, 2)?.from).toBe(0);
  });
});

describe('parsePrices', () => {
  const slots = SAMPLE.starts.map((ms, i) => ({
    start: new Date(ms).toISOString(),
    total: SAMPLE.totals[i],
  }));

  it('reads an API response', () => {
    const day = parsePrices({
      zone: 'DK2',
      mode: 'full',
      gridCompany: { name: 'Radius Elnet A/S' },
      slots,
    });
    expect(day).toEqual(SAMPLE);
  });

  it('rejects anything it does not understand', () => {
    expect(parsePrices(null)).toBeNull();
    expect(parsePrices({ slots: 'nope' })).toBeNull();
    expect(parsePrices({ slots: slots.slice(0, 4) })).toBeNull();
    expect(parsePrices({ slots: [...slots, { start: 'x', total: 1 }] })).toBeNull();
  });

  it('labels a spot-only fallback', () => {
    expect(parsePrices({ mode: 'spot-only', gridCompany: null, slots })?.mode).toBe('spot-only');
  });
});

describe('time helpers', () => {
  it('asks the API for today in Copenhagen, not UTC', () => {
    const lateEvening = Date.UTC(2026, 9, 28, 23, 30); // 00:30 on the 29th in Copenhagen
    expect(copenhagenDate(lateEvening)).toBe('2026-10-29');
    expect(pricesUrl(lateEvening)).toContain('date=2026-10-29');
  });

  it('finds the quarter hour containing a moment', () => {
    expect(slotAt(SAMPLE, SAMPLE.starts[10]! + 60_000)).toBe(10);
    expect(slotAt(SAMPLE, 0)).toBe(-1);
  });
});
