import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  allocateLargestRemainder,
  buildLedger,
  formatCents,
  remainingCents,
  roundHalfUp,
  sumValues,
  taxCents,
} from '../ledger';

const JURISDICTIONS = [
  { id: 'state', label: 'state', rateBp: 625 },
  { id: 'county', label: 'county', rateBp: 175 },
  { id: 'city', label: 'city', rateBp: 50 },
];
const DEMO_ITEMS = [
  { id: 'headphones', label: 'headphones', amountCents: 2499 },
  { id: 'cable', label: 'cable', amountCents: 1295 },
  { id: 'case', label: 'case', amountCents: 1575 },
];

describe('rounding', () => {
  it('rounds half up', () => {
    expect(roundHalfUp(5, 10)).toBe(1);
    expect(roundHalfUp(4, 10)).toBe(0);
    expect(roundHalfUp(15, 10)).toBe(2);
  });

  it('computes tax in cents at a basis-point rate', () => {
    expect(taxCents(5369, 625)).toBe(336); // 335.5625
    expect(taxCents(5369, 50)).toBe(27); // 26.845
  });
});

describe('allocateLargestRemainder', () => {
  it('splits proportionally and hands leftovers to the largest remainders', () => {
    expect(allocateLargestRemainder(10, [1, 1, 1])).toEqual([4, 3, 3]);
    expect(allocateLargestRemainder(100, [50, 30, 20])).toEqual([50, 30, 20]);
  });

  it('returns zeros when every weight is zero', () => {
    expect(allocateLargestRemainder(7, [0, 0])).toEqual([0, 0]);
  });

  it('always sums to the total, never goes negative, and stays within 1 of the exact share', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.array(fc.integer({ min: 1, max: 1_000_000 }), { minLength: 1, maxLength: 20 }),
        (total, weights) => {
          const parts = allocateLargestRemainder(total, weights);
          const weightSum = weights.reduce((a, b) => a + b, 0);
          expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
          parts.forEach((part, i) => {
            expect(part).toBeGreaterThanOrEqual(0);
            expect(Math.abs(part - (total * weights[i]!) / weightSum)).toBeLessThan(1);
          });
        },
      ),
    );
  });
});

describe('buildLedger', () => {
  it('reproduces the demo basket: engine $4.57, naive per-line rounding $4.56', () => {
    const ledger = buildLedger(DEMO_ITEMS, JURISDICTIONS);
    expect(ledger.subtotalCents).toBe(5369);
    expect(ledger.engineCents).toEqual({ state: 336, county: 94, city: 27 });
    expect(sumValues(ledger.engineCents)).toBe(457);
    expect(sumValues(ledger.naiveCents)).toBe(456);
  });

  it('keeps every jurisdiction column equal to the engine quote for any basket', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 500_000 }), { minLength: 1, maxLength: 12 }),
        (amounts) => {
          const items = amounts.map((amountCents, i) => ({
            id: `i${i}`,
            label: `i${i}`,
            amountCents,
          }));
          const ledger = buildLedger(items, JURISDICTIONS);
          for (const j of JURISDICTIONS) {
            const column = items.reduce(
              (sum, item) => sum + ledger.allocations[item.id]![j.id]!,
              0,
            );
            expect(column).toBe(ledger.engineCents[j.id]);
          }
        },
      ),
    );
  });

  it('refunds reverse exactly the refunded lines: owed + refunded = engine total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 500_000 }), { minLength: 1, maxLength: 12 }),
        fc.array(fc.boolean(), { minLength: 12, maxLength: 12 }),
        (amounts, refundMask) => {
          const items = amounts.map((amountCents, i) => ({
            id: `i${i}`,
            label: `i${i}`,
            amountCents,
          }));
          const ledger = buildLedger(items, JURISDICTIONS);
          const refunded = items.filter((_, i) => refundMask[i]).map((item) => item.id);
          const owed = sumValues(remainingCents(ledger, refunded));
          const reversed = refunded.reduce(
            (sum, id) => sum + sumValues(ledger.allocations[id]!),
            0,
          );
          expect(owed + reversed).toBe(sumValues(ledger.engineCents));
          expect(owed).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });
});

describe('formatCents', () => {
  it('formats positive and negative amounts', () => {
    expect(formatCents(457)).toBe('$4.57');
    expect(formatCents(-156)).toBe('−$1.56');
    expect(formatCents(0)).toBe('$0.00');
  });
});
