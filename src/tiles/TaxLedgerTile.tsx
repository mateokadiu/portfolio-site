import { useMemo, useState } from 'react';
import { cssVars } from '~/lib/cssVars';
import {
  type Jurisdiction,
  type LineItem,
  buildLedger,
  formatCents,
  remainingCents,
  sumValues,
} from '~/lib/ledger';

const JURISDICTIONS: Jurisdiction[] = [
  { id: 'state', label: 'state 6.25%', rateBp: 625 },
  { id: 'county', label: 'county 1.75%', rateBp: 175 },
  { id: 'city', label: 'city 0.50%', rateBp: 50 },
];

// Picked so that rounding each line on its own drifts a cent in every
// jurisdiction — the bug the ledger exists to prevent.
const ITEMS: LineItem[] = [
  { id: 'headphones', label: 'headphones', amountCents: 2499 },
  { id: 'cable', label: 'cable', amountCents: 1295 },
  { id: 'case', label: 'case', amountCents: 1575 },
];

const LEDGER = buildLedger(ITEMS, JURISDICTIONS);
const ENGINE_TOTAL = sumValues(LEDGER.engineCents);
const NAIVE_TOTAL = sumValues(LEDGER.naiveCents);

export default function TaxLedgerTile() {
  const [refunded, setRefunded] = useState<string[]>([]);

  const remaining = useMemo(() => remainingCents(LEDGER, refunded), [refunded]);
  const remainingTotal = sumValues(remaining);
  const refundedTotal = ENGINE_TOTAL - remainingTotal;
  const drift = NAIVE_TOTAL - ENGINE_TOTAL;

  const toggleRefund = (id: string) =>
    setRefunded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">tax-ledger</h3>
          <p className="mt-1 text-xs text-muted">refunds reverse cent-exact allocations</p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex-1 space-y-3">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
            <span>order</span>
            <span>
              subtotal {formatCents(LEDGER.subtotalCents)} · tax {formatCents(ENGINE_TOTAL)}
            </span>
          </div>
          <ul className="space-y-1.5">
            {ITEMS.map((item) => {
              const isRefunded = refunded.includes(item.id);
              const lineTax = sumValues(LEDGER.allocations[item.id] ?? {});
              return (
                <li key={item.id} className="flex items-center gap-2 font-mono text-[11px]">
                  <span
                    className={`min-w-0 flex-1 truncate ${isRefunded ? 'text-muted line-through' : 'text-foreground'}`}
                  >
                    {item.label} · {formatCents(item.amountCents)}
                  </span>
                  <span className="text-muted">tax {formatCents(lineTax)}</span>
                  <button
                    type="button"
                    onClick={() => toggleRefund(item.id)}
                    aria-pressed={isRefunded}
                    aria-label={`${isRefunded ? 'restore' : 'refund'} ${item.label}`}
                    className={`min-h-6 rounded border px-2 font-mono text-[11px] transition-colors ${
                      isRefunded
                        ? 'border-accent/40 text-accent hover:border-accent'
                        : 'border-border/60 text-muted hover:border-accent/40 hover:text-foreground'
                    }`}
                  >
                    {isRefunded ? 'restore' : 'refund'}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <ul className="space-y-1.5" aria-label="tax owed per jurisdiction">
          {JURISDICTIONS.map((j) => {
            const owed = remaining[j.id] ?? 0;
            const delta = owed - (LEDGER.engineCents[j.id] ?? 0);
            return (
              <li
                key={j.id}
                className="flex items-center justify-between rounded border border-border/60 bg-card px-2 py-1.5 font-mono text-[11px]"
              >
                <span className="text-muted">{j.label}</span>
                <span className="flex items-center gap-2">
                  {delta !== 0 && (
                    <span
                      key={delta}
                      className="anim-enter rounded bg-red-500/15 px-1 text-red-300"
                      style={cssVars({ '--enter-x': '-4px', '--enter-y': '0' })}
                    >
                      {formatCents(delta)}
                    </span>
                  )}
                  <span className="text-foreground">{formatCents(owed)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        key={refunded.join()}
        className={`mt-3 space-y-1 rounded border px-2 py-2 font-mono text-[11px] ${
          refunded.length > 0
            ? 'anim-glow border-accent/50 bg-accent/10 text-accent'
            : 'border-border/60 text-muted'
        }`}
      >
        <p aria-live="polite">
          {refunded.length === 0
            ? `Σ lines = engine ${formatCents(ENGINE_TOTAL)} ✓ to the cent`
            : `owed ${formatCents(remainingTotal)} + refunded ${formatCents(refundedTotal)} = ${formatCents(ENGINE_TOTAL)} ✓`}
        </p>
        <p className="text-muted">
          naive per-line rounding: {formatCents(NAIVE_TOTAL)}
          {drift !== 0 && ` (${drift > 0 ? '+' : '−'}${Math.abs(drift)}¢ drift)`}
        </p>
      </div>
    </div>
  );
}
