import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NARRATIVES, SAMPLE_TRADE } from '~/lib/copilotNarratives';

const TYPING_MS = 18;

export default function AiTradingCopilotTile() {
  const reduced = useReducedMotion();
  const [variant, setVariant] = useState(0);
  const [shown, setShown] = useState(0);
  const text = NARRATIVES[variant % NARRATIVES.length] ?? '';

  useEffect(() => {
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) clearInterval(id);
    }, TYPING_MS);
    return () => clearInterval(id);
  }, [text, reduced]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">
            ai-trading-copilot · <span className="text-muted">private</span>
          </h3>
          <p className="mt-1 text-xs text-muted">narrates trades against your stated plan</p>
        </div>
        <span
          aria-label="private project"
          className="rounded-full border border-border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-muted"
        >
          private
        </span>
      </header>

      <div className="mt-4 flex-1 space-y-3">
        <div className="rounded-lg border border-border/60 bg-background/60 p-2.5 font-mono text-[10px] text-foreground/90">
          <div className="flex items-center justify-between text-muted">
            <span>trade</span>
            <span>{SAMPLE_TRADE.window}</span>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>pair</span>
            <span className="text-foreground">{SAMPLE_TRADE.pair}</span>
            <span>side</span>
            <span className="text-foreground">{SAMPLE_TRADE.side}</span>
            <span>lot</span>
            <span className="text-foreground">{SAMPLE_TRADE.lot}</span>
            <span>held</span>
            <span className="text-foreground">{SAMPLE_TRADE.durationMin}m</span>
            <span>p&amp;l</span>
            <span className={SAMPLE_TRADE.pnl >= 0 ? 'text-accent' : 'text-red-300'}>
              {SAMPLE_TRADE.pnl >= 0 ? '+' : ''}${SAMPLE_TRADE.pnl.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/60 p-2.5">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            ▸ generated narrative
          </p>
          <p className="font-sans text-[12px] leading-snug text-foreground/90" aria-live="polite">
            {text.slice(0, shown)}
            {shown < text.length && (
              <motion.span
                className="ml-px inline-block h-[10px] w-[5px] -mb-0.5 bg-accent/80 align-middle"
                animate={reduced ? undefined : { opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, repeat: Number.POSITIVE_INFINITY }}
                aria-hidden="true"
              />
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted">
        <span>
          narrative {(variant % NARRATIVES.length) + 1} / {NARRATIVES.length}
        </span>
        <button
          type="button"
          onClick={() => setVariant((v) => v + 1)}
          className="rounded border border-border/60 px-1.5 py-0.5 hover:border-accent/40 hover:text-foreground"
        >
          ⟳ regenerate
        </button>
      </div>
    </div>
  );
}
