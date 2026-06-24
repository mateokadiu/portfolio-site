import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

interface Attempt {
  label: string;
  status: 'ok' | 'retrying' | 'failed';
}

// Real default schedule from the webhook-gateway repo.
const BACKOFF_SECONDS = [30, 120, 600, 3600, 21600, 86400];

const labelFor = (sec: number) => {
  if (sec === 0) return 'fired';
  if (sec < 60) return `+${sec}s`;
  if (sec < 3600) return `+${sec / 60}m`;
  if (sec < 86400) return `+${sec / 3600}h`;
  return `+${sec / 86400}d`;
};

function attemptsAt(step: number, downstreamDown: boolean): Attempt[] {
  if (!downstreamDown) {
    return step > 0 ? [{ label: 'fired', status: 'ok' }] : [];
  }
  const out: Attempt[] = [{ label: 'fired', status: 'retrying' }];
  for (let i = 0; i < step - 1 && i < BACKOFF_SECONDS.length; i += 1) {
    const isLast = i === BACKOFF_SECONDS.length - 1 && step - 1 > i;
    out.push({
      label: labelFor(BACKOFF_SECONDS[i]),
      status: isLast ? 'failed' : 'retrying',
    });
  }
  return out;
}

export default function WebhookGatewayTile() {
  const [downstreamDown, setDownstreamDown] = useState(true);
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();

  const attempts = attemptsAt(step, downstreamDown);
  const maxStep = downstreamDown ? BACKOFF_SECONDS.length + 1 : 1;
  const atEnd = step >= maxStep;
  const atDlq = downstreamDown && step >= BACKOFF_SECONDS.length + 1;

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

      <div className="mt-4 flex-1 overflow-hidden">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
            <span>delivery timeline</span>
            <span>{step === 0 ? '—' : `step ${Math.min(step, maxStep)} / ${maxStep}`}</span>
          </div>
          <div className="flex min-h-[44px] flex-wrap items-center gap-2">
            {attempts.map((a) => (
              <motion.div
                key={`${downstreamDown}-${a.label}`}
                initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] ${
                  a.status === 'ok'
                    ? 'border-accent/30 bg-accent/10 text-foreground'
                    : a.status === 'retrying'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                      : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}
              >
                <span aria-hidden="true">
                  {a.status === 'ok' ? '✓' : a.status === 'retrying' ? '⟳' : '✘'}
                </span>
                <span>{a.label}</span>
              </motion.div>
            ))}
            {atDlq && (
              <motion.span
                key="dlq"
                initial={reduced ? { opacity: 1 } : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32 }}
                className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[11px] text-red-200"
              >
                → DLQ
              </motion.span>
            )}
            {step === 0 && (
              <span className="font-mono text-[11px] text-muted">
                click &ldquo;fire delivery&rdquo; to start
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted" aria-live="polite">
          {step === 0 && 'no attempts yet'}
          {step === 1 && downstreamDown && '1st attempt failed — backing off 30s'}
          {step >= 2 &&
            step <= BACKOFF_SECONDS.length &&
            downstreamDown &&
            `retry ${step - 1} failed — backing off ${labelFor(BACKOFF_SECONDS[step - 1] ?? 0).replace('+', '')}`}
          {atDlq && 'parked in DLQ after 5 retries — needs manual replay'}
          {!downstreamDown && step >= 1 && 'delivered on the first try'}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <button
          type="button"
          onClick={() => {
            if (atEnd) {
              setStep(downstreamDown ? 1 : 1);
            } else {
              setStep((s) => s + 1);
            }
          }}
          disabled={atDlq}
          className="min-h-[28px] rounded-md border border-accent/40 bg-accent/10 px-3 py-1 text-accent transition-colors hover:bg-accent/15 disabled:opacity-40"
        >
          {step === 0
            ? '▶ fire delivery'
            : atDlq
              ? '✘ in DLQ'
              : downstreamDown
                ? '▶ next retry'
                : '▶ replay'}
        </button>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="min-h-[28px] rounded-md border border-border/60 px-3 py-1 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
        >
          ⟳ reset
        </button>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={downstreamDown}
            onChange={(e) => {
              setDownstreamDown(e.target.checked);
              setStep(0);
            }}
            className="h-4 w-4 cursor-pointer accent-[oklch(0.65_0.18_25)]"
          />
          downstream down
        </label>
      </div>
    </div>
  );
}
