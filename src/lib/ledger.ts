// Integer-cent tax ledger used by the tax-ledger demo. Mirrors the idea of the
// real library: the engine quotes tax per jurisdiction on the whole order, and
// that quote is allocated back to line items with the Hamilton (largest
// remainder) method so the lines always sum to the engine total to the cent.

export interface Jurisdiction {
  id: string;
  label: string;
  /** Rate in basis points: 625 = 6.25%. */
  rateBp: number;
}

export interface LineItem {
  id: string;
  label: string;
  amountCents: number;
}

export interface Ledger {
  subtotalCents: number;
  /** Engine quote per jurisdiction, rounded once on the order subtotal. */
  engineCents: Record<string, number>;
  /** Allocated tax per item, per jurisdiction. Columns sum to engineCents exactly. */
  allocations: Record<string, Record<string, number>>;
  /** What rounding each line on its own would have produced, per jurisdiction. */
  naiveCents: Record<string, number>;
}

/** Round num/den half-up to an integer (non-negative inputs). */
export function roundHalfUp(num: number, den: number): number {
  return Math.floor((2 * num + den) / (2 * den));
}

/** Tax on an amount in cents at a basis-point rate, rounded half-up to the cent. */
export function taxCents(amountCents: number, rateBp: number): number {
  return roundHalfUp(amountCents * rateBp, 10_000);
}

/**
 * Split `total` across `weights` proportionally so the parts sum to `total`
 * exactly. Floors every share, then hands the leftover units to the largest
 * remainders (ties: larger weight first, then earlier index).
 */
export function allocateLargestRemainder(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weightSum === 0) return weights.map(() => 0);

  const shares = weights.map((w, index) => {
    const numerator = total * w;
    return {
      index,
      weight: w,
      floor: Math.floor(numerator / weightSum),
      remainder: numerator % weightSum,
    };
  });

  let leftover = total - shares.reduce((sum, s) => sum + s.floor, 0);
  const byRemainder = [...shares].sort(
    (a, b) => b.remainder - a.remainder || b.weight - a.weight || a.index - b.index,
  );
  const result = shares.map((s) => s.floor);
  for (const share of byRemainder) {
    if (leftover === 0) break;
    result[share.index]! += 1;
    leftover -= 1;
  }
  return result;
}

export function buildLedger(items: LineItem[], jurisdictions: Jurisdiction[]): Ledger {
  const subtotalCents = items.reduce((sum, item) => sum + item.amountCents, 0);
  const weights = items.map((item) => item.amountCents);
  const engineCents: Record<string, number> = {};
  const naiveCents: Record<string, number> = {};
  const allocations: Record<string, Record<string, number>> = Object.fromEntries(
    items.map((item) => [item.id, {}]),
  );

  for (const j of jurisdictions) {
    const engine = taxCents(subtotalCents, j.rateBp);
    engineCents[j.id] = engine;
    naiveCents[j.id] = items.reduce((sum, item) => sum + taxCents(item.amountCents, j.rateBp), 0);
    allocateLargestRemainder(engine, weights).forEach((cents, i) => {
      allocations[items[i]!.id]![j.id] = cents;
    });
  }

  return { subtotalCents, engineCents, allocations, naiveCents };
}

/** Tax still owed per jurisdiction after reversing the allocations of refunded items. */
export function remainingCents(
  ledger: Ledger,
  refundedIds: readonly string[],
): Record<string, number> {
  const remaining = { ...ledger.engineCents };
  for (const id of refundedIds) {
    for (const [jurisdiction, cents] of Object.entries(ledger.allocations[id] ?? {})) {
      remaining[jurisdiction] = (remaining[jurisdiction] ?? 0) - cents;
    }
  }
  return remaining;
}

export const sumValues = (record: Record<string, number>): number =>
  Object.values(record).reduce((sum, v) => sum + v, 0);

export function formatCents(cents: number): string {
  const sign = cents < 0 ? '−' : '';
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}
