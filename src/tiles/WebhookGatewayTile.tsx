import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Attempt {
  id: number;
  status: 'ok' | 'retrying' | 'failed';
  backoffMs: number;
  durationMs: number;
}

// Real default schedule from the webhook-gateway repo.
const BACKOFF_SCHEDULE = [30, 120, 600, 3600, 21600, 86400]; // seconds

function buildDeliveries(downstreamDown: boolean): Attempt[][] {
  // First delivery — always succeeds.
  const ok: Attempt = { id: 0, status: 'ok', backoffMs: 0, durationMs: 220 };

  if (!downstreamDown) {
    return [[ok], [{ ...ok, id: 1 }], [{ ...ok, id: 2 }]];
  }

  // When downstream is down, walk the schedule and eventually park in DLQ.
  const second: Attempt[] = BACKOFF_SCHEDULE.slice(0, 4).map((s, i) => ({
    id: i,
    status: i === 3 ? 'failed' : 'retrying',
    backoffMs: s * 1000,
    durationMs: 220,
  }));

  return [[ok], second, [{ ...ok, id: 2 }]];
}

const labelFor = (sec: number) => {
  if (sec === 0) return 'fired';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${sec / 60}m`;
  if (sec < 86400) return `${sec / 3600}h`;
  return `${sec / 86400}d`;
};

export default function WebhookGatewayTile() {
  const [downstreamDown, setDownstreamDown] = useState(true);
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();

  const deliveries = useMemo(() => buildDeliveries(downstreamDown), [downstreamDown]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">webhook-gateway</h3>
          <p className="mt-1 text-xs text-muted">retry with exponential backoff, then DLQ</p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex-1 space-y-2 overflow-hidden">
        {deliveries.map((attempts, deliveryIdx) => (
          <div key={`d-${deliveryIdx}`} className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
              <span>delivery #{deliveryIdx + 1}</span>
              <span>
                {attempts.length} attempt{attempts.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {attempts.map((a, i) => (
                <motion.div
                  key={`${run}-${deliveryIdx}-${i}`}
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono ${
                    a.status === 'ok'
                      ? 'bg-accent/15 text-accent'
                      : a.status === 'retrying'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-red-500/15 text-red-300'
                  }`}
                  initial={
                    reduced ? { opacity: 1 } : { opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }
                  }
                  animate={{ opacity: 1, width: 'auto', paddingLeft: 6, paddingRight: 6 }}
                  transition={{
                    delay: reduced ? 0 : i * 0.18,
                    duration: 0.42,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {a.status === 'ok' && '✓'}
                  {a.status === 'retrying' && '⟳'}
                  {a.status === 'failed' && '✘'}
                  <span>{labelFor(a.backoffMs / 1000)}</span>
                </motion.div>
              ))}
              {downstreamDown && deliveryIdx === 1 && (
                <motion.span
                  key={`dlq-${run}`}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduced ? 0 : 4 * 0.18 + 0.15, duration: 0.32 }}
                  className="rounded border border-red-500/30 px-1.5 py-0.5 font-mono text-[10px] text-red-300"
                >
                  → DLQ
                </motion.span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px]">
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={downstreamDown}
            onChange={(e) => {
              setDownstreamDown(e.target.checked);
              setRun((r) => r + 1);
            }}
            className="h-3 w-3 accent-[oklch(0.65_0.18_25)]"
          />
          downstream down
        </label>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="rounded border border-border/60 px-1.5 py-0.5 text-muted hover:border-accent/40 hover:text-foreground"
        >
          ▶ replay
        </button>
      </div>
    </div>
  );
}
