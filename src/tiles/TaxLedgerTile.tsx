import { useMemo, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';

interface Item {
  id: string;
  label: string;
  amount: number;
}

const RATES = {
  state: 0.06,
  county: 0.015,
  city: 0.005,
};

const RATE_LABELS: Record<keyof typeof RATES, string> = {
  state: 'CA state (6%)',
  county: 'SF county (1.5%)',
  city: 'SF city (0.5%)',
};

const ITEMS: Item[] = [
  { id: 'a', label: 'item 1', amount: 40 },
  { id: 'b', label: 'item 2', amount: 30 },
  { id: 'c', label: 'item 3', amount: 20 },
];

interface Split {
  state: number;
  county: number;
  city: number;
}

const splitItem = (amount: number): Split => ({
  state: amount * RATES.state,
  county: amount * RATES.county,
  city: amount * RATES.city,
});

const totalSplit = (items: Item[]): Split =>
  items.reduce<Split>(
    (acc, item) => {
      const s = splitItem(item.amount);
      return {
        state: acc.state + s.state,
        county: acc.county + s.county,
        city: acc.city + s.city,
      };
    },
    { state: 0, county: 0, city: 0 },
  );

const fmt = (n: number) => (n < 0 ? '-' : '') + `$${Math.abs(n).toFixed(2)}`;

export default function TaxLedgerTile() {
  const [refunded, setRefunded] = useState<string[]>([]);
  const reduced = useReducedMotion();

  const remaining = ITEMS.filter((it) => !refunded.includes(it.id));
  const baseTotal = useMemo(() => totalSplit(ITEMS), []);
  const currentTotal = useMemo(() => totalSplit(remaining), [remaining]);

  const deltaState = currentTotal.state - baseTotal.state;
  const deltaCounty = currentTotal.county - baseTotal.county;
  const deltaCity = currentTotal.city - baseTotal.city;
  const deltaSum = deltaState + deltaCounty + deltaCity;
  const refundedSum = ITEMS.filter((it) => refunded.includes(it.id)).reduce(
    (acc, it) => acc + it.amount * (RATES.state + RATES.county + RATES.city),
    0,
  );
  const invariantHolds = Math.abs(Math.abs(deltaSum) - refundedSum) < 0.0001;

  const toggleRefund = (id: string) => {
    setRefunded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const subtotal = remaining.reduce((s, it) => s + it.amount, 0);
  const taxTotal = currentTotal.state + currentTotal.county + currentTotal.city;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">tax-ledger</h3>
          <p className="mt-1 text-xs text-muted">refund splits per jurisdiction · invariant proven visually</p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex-1 space-y-4">
        <LayoutGroup>
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
              <span>order</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <ul className="space-y-1.5">
              {ITEMS.map((item) => {
                const isRefunded = refunded.includes(item.id);
                return (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <motion.span
                      layout
                      className={`font-mono text-[11px] ${isRefunded ? 'text-muted line-through' : 'text-foreground'}`}
                    >
                      {item.label} · {fmt(item.amount)}
                    </motion.span>
                    <button
                      type="button"
                      onClick={() => toggleRefund(item.id)}
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
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

          <div className="space-y-1.5">
            {(['state', 'county', 'city'] as const).map((juris) => {
              const cur = currentTotal[juris];
              const delta =
                juris === 'state' ? deltaState : juris === 'county' ? deltaCounty : deltaCity;
              return (
                <motion.div
                  key={juris}
                  layout
                  className="flex items-center justify-between rounded border border-border/60 bg-card px-2 py-1.5 font-mono text-[11px]"
                  transition={
                    reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 28 }
                  }
                >
                  <span className="text-muted">{RATE_LABELS[juris]}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-foreground">{fmt(cur)}</span>
                    {delta !== 0 && (
                      <motion.span
                        key={delta}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded bg-red-500/15 px-1 py-px text-[10px] text-red-300"
                      >
                        {fmt(delta)}
                      </motion.span>
                    )}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            layout
            animate={
              invariantHolds && refunded.length > 0 && !reduced
                ? { boxShadow: ['0 0 0 0 oklch(0.65 0.18 25 / 0)', '0 0 0 4px oklch(0.65 0.18 25 / 0.18)', '0 0 0 0 oklch(0.65 0.18 25 / 0)'] }
                : { boxShadow: '0 0 0 0 oklch(0.65 0.18 25 / 0)' }
            }
            transition={{ duration: 0.7 }}
            className={`flex items-center justify-between rounded border px-2 py-2 font-mono text-[11px] ${
              invariantHolds && refunded.length > 0
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-border/60 text-muted'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  invariantHolds && refunded.length > 0
                    ? 'bg-accent shadow-[0_0_8px_oklch(0.65_0.18_25)]'
                    : 'bg-muted/40'
                }`}
              />
              tax total · <span className="text-foreground">{fmt(taxTotal)}</span>
            </span>
            <span aria-live="polite">
              {refunded.length === 0
                ? 'no refunds yet'
                : invariantHolds
                  ? `Σ ✓  delta ${fmt(deltaSum)}  ≡  refunded tax ${fmt(refundedSum)}`
                  : 'sum invariant violated'}
            </span>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
}
