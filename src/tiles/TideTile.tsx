import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Surface {
  id: string;
  label: string;
  detail: string;
}

const SURFACES: Surface[] = [
  { id: 'web', label: 'web', detail: 'paste url' },
  { id: 'ext', label: 'extension', detail: 'mv3 · chrome + firefox' },
  { id: 'mail', label: 'email', detail: 'save+uuid@tide' },
  { id: 'api', label: 'api', detail: 'bearer · POST /v1/articles' },
];

const PIPELINE = ['extract', 'tag', 'embed', 'summarize'] as const;

export default function TideTile() {
  const reduced = useReducedMotion();
  const [picked, setPicked] = useState('web');
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % (PIPELINE.length + 2));
    }, 1100);
    return () => clearInterval(t);
  }, [reduced]);

  const surface = SURFACES.find((s) => s.id === picked) ?? SURFACES[0]!;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">tide</h3>
          <p className="mt-1 text-xs text-muted">
            Self-hostable read-later · Next.js 16 + RSC + pgvector + Anthropic
          </p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            capture surface
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SURFACES.map((s) => {
              const active = s.id === picked;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPicked(s.id)}
                  className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    active
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : 'border-border/60 text-muted hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted">
            <span className="text-foreground">→</span> {surface.detail}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-[11px]">
          <div className="mb-2 flex items-center justify-between text-muted">
            <span className="truncate">
              article · <span className="text-foreground">building tide v1</span>
            </span>
            <span className="text-[10px]">2m read</span>
          </div>
          <ul className="space-y-1">
            {PIPELINE.map((label, i) => {
              const done = step > i;
              const active = step === i;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      done
                        ? 'bg-accent shadow-[0_0_6px_oklch(0.65_0.18_25)]'
                        : active
                          ? 'animate-pulse bg-accent/60'
                          : 'bg-muted/40'
                    }`}
                  />
                  <span className={done || active ? 'text-foreground' : 'text-muted'}>{label}</span>
                  {active && !reduced && (
                    <motion.span
                      key={`${label}-active`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-mono text-[10px] text-muted"
                    >
                      …running
                    </motion.span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center justify-between rounded border border-border/60 bg-card px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          <span>
            lighthouse <span className="text-foreground">100·100·96·100</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_oklch(0.65_0.18_25)]" />
            <span className="text-accent">streaming ai</span>
          </span>
        </div>
      </div>
    </div>
  );
}
