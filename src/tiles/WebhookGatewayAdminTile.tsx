import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type Filter = 'all' | 'ok' | 'failed';

interface Row {
  id: string;
  source: string;
  status: 'ok' | 'failed' | 'retrying';
  age: string;
}

const ROWS: Row[] = [
  { id: '0da0724e', source: 'stripe', status: 'failed', age: '12s ago' },
  { id: '7c15e540', source: 'shopify', status: 'retrying', age: '34s ago' },
  { id: 'f8872b12', source: 'stripe', status: 'ok', age: '1m ago' },
  { id: 'dec86c20', source: 'github', status: 'ok', age: '2m ago' },
  { id: '12315a33', source: 'stripe', status: 'failed', age: '3m ago' },
  { id: 'f10572b5', source: 'github', status: 'ok', age: '4m ago' },
];

const STATUS_DOT: Record<Row['status'], string> = {
  ok: 'bg-emerald-400',
  retrying: 'bg-amber-400',
  failed: 'bg-red-400',
};

export default function WebhookGatewayAdminTile() {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>('all');
  const [received, setReceived] = useState(127);
  const [delivered, setDelivered] = useState(118);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setReceived((n) => n + 1);
      if (Math.random() > 0.2) setDelivered((n) => n + 1);
    }, 2400);
    return () => clearInterval(t);
  }, [reduced]);

  const visibleRows = useMemo(
    () => (filter === 'all' ? ROWS : ROWS.filter((r) => r.status === filter)),
    [filter],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">webhook-gateway-admin</h3>
          <p className="mt-1 text-xs text-muted">
            Angular 19 admin · zoneless · <span className="font-mono text-accent">signal()</span>{' '}
            filters
          </p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex-1 overflow-hidden">
        {/* mini sidebar + content layout, mimicking the real admin */}
        <div className="grid grid-cols-[88px_1fr] gap-2 rounded-lg border border-border/60 bg-background/40 p-2">
          <aside className="border-r border-border/60 pr-2">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted">nav</p>
            <ul className="space-y-1 font-mono text-[10px] text-muted">
              <li className="rounded bg-card-hover px-1.5 py-0.5 text-foreground">▣ dashboard</li>
              <li className="px-1.5 py-0.5">◫ events</li>
              <li className="px-1.5 py-0.5">↳ deliveries</li>
              <li className="px-1.5 py-0.5">◐ sources</li>
            </ul>
          </aside>

          <div className="min-w-0 space-y-2">
            {/* stat cards (signal-driven counters) */}
            <div className="grid grid-cols-2 gap-1.5">
              <motion.div
                key={`rec-${received}`}
                initial={reduced ? false : { opacity: 0.6, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded border border-border/60 px-2 py-1"
              >
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted">received</p>
                <p className="font-mono text-base tabular-nums leading-tight">{received}</p>
              </motion.div>
              <motion.div
                key={`del-${delivered}`}
                initial={reduced ? false : { opacity: 0.6, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded border border-border/60 px-2 py-1"
              >
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                  delivered
                </p>
                <p className="font-mono text-base tabular-nums leading-tight text-emerald-300">
                  {delivered}
                </p>
              </motion.div>
            </div>

            {/* filter pills */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              {(['all', 'ok', 'failed'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded px-1.5 py-0.5 transition-colors ${
                    filter === f
                      ? 'border border-accent/40 bg-accent/15 text-accent'
                      : 'border border-border/60 text-muted hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-[9px] text-muted">{visibleRows.length} rows</span>
            </div>

            {/* events table */}
            <ul className="space-y-1 overflow-hidden font-mono text-[10px]">
              {visibleRows.slice(0, 4).map((r) => (
                <motion.li
                  key={`${filter}-${r.id}`}
                  initial={reduced ? false : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2 rounded border border-border/40 px-1.5 py-1"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status]}`} aria-hidden />
                  <span className="text-muted">{r.id.slice(0, 6)}</span>
                  <span className="truncate">{r.source}</span>
                  <span className="ml-auto text-[9px] text-muted">{r.age}</span>
                </motion.li>
              ))}
              {visibleRows.length === 0 && (
                <li className="rounded border border-dashed border-border/60 px-2 py-3 text-center text-[10px] text-muted">
                  no matches
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] text-muted">
        filter is a <span className="text-accent">signal()</span>;{' '}
        <span className="text-accent">computed()</span> derives the visible rows
      </p>
    </div>
  );
}
