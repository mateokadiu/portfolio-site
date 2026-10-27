import { useState } from 'react';
import { cssVars } from '~/lib/cssVars';
import { DLQ_STEP, attemptsAt, statusMessage } from '~/lib/webhook';

export default function WebhookGatewayTile() {
  const [downstreamDown, setDownstreamDown] = useState(true);
  const [step, setStep] = useState(0);
  // Bumped on every replay so the entrance animation re-runs on the same step.
  const [run, setRun] = useState(0);

  const attempts = attemptsAt(step, downstreamDown);
  const maxStep = downstreamDown ? DLQ_STEP : 1;
  const atDlq = downstreamDown && step >= DLQ_STEP;

  const fire = () => {
    if (step >= maxStep) {
      setStep(1);
      setRun((r) => r + 1);
    } else {
      setStep((s) => s + 1);
    }
  };

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
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
            <span>delivery timeline</span>
            <span>{step === 0 ? '—' : `step ${Math.min(step, maxStep)} / ${maxStep}`}</span>
          </div>
          <ol
            className="flex min-h-[44px] flex-wrap items-center gap-2"
            aria-label="delivery attempts"
          >
            {attempts.map((a) => (
              <li
                key={`${run}-${downstreamDown}-${a.label}`}
                className={`anim-enter flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] ${
                  a.status === 'ok'
                    ? 'border-accent/30 bg-accent/10 text-foreground'
                    : a.status === 'retrying'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                      : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}
                style={cssVars({ '--enter-y': '-4px', '--enter-scale': 0.85 })}
              >
                <span aria-hidden="true">
                  {a.status === 'ok' ? '✓' : a.status === 'retrying' ? '⟳' : '✘'}
                </span>
                <span>{a.label}</span>
                <span className="sr-only">{a.status}</span>
              </li>
            ))}
            {atDlq && (
              <li
                className="anim-enter rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[11px] text-red-200"
                style={cssVars({ '--enter-x': '-8px', '--enter-y': '0' })}
              >
                → DLQ
              </li>
            )}
            {step === 0 && (
              <li className="font-mono text-[11px] text-muted">
                click &ldquo;fire delivery&rdquo; to start
              </li>
            )}
          </ol>
        </div>

        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted" aria-live="polite">
          {statusMessage(step, downstreamDown)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <button
          type="button"
          onClick={fire}
          disabled={atDlq}
          className="min-h-7 rounded-md border border-accent/40 bg-accent/10 px-3 py-1 text-accent transition-colors hover:bg-accent/15 disabled:opacity-40"
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
          className="min-h-7 rounded-md border border-border/60 px-3 py-1 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
        >
          ⟳ reset
        </button>
        <label className="ml-auto flex min-h-7 cursor-pointer items-center gap-2 text-muted">
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
