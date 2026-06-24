import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  REAUTH_TIMER_MS,
  STRIPE_EDGES,
  STRIPE_NODES,
  STRIPE_NODE_BY_ID,
  STRIPE_SCRIPT,
  STRIPE_TERMINAL,
  useTemporalStripeStore,
} from '~/lib/temporalStripeStore';

export default function TemporalStripeTile() {
  const current = useTemporalStripeStore((s) => s.current);
  const reauthMs = useTemporalStripeStore((s) => s.reauthMs);
  const step = useTemporalStripeStore((s) => s.step);
  const playing = useTemporalStripeStore((s) => s.playing);
  const illegal = useTemporalStripeStore((s) => s.illegal);
  const play = useTemporalStripeStore((s) => s.play);
  const pause = useTemporalStripeStore((s) => s.pause);
  const reset = useTemporalStripeStore((s) => s.reset);
  const jumpTo = useTemporalStripeStore((s) => s.jumpTo);
  const advance = useTemporalStripeStore((s) => s.advance);
  const clearIllegal = useTemporalStripeStore((s) => s.clearIllegal);
  const setReauthMs = useTemporalStripeStore((s) => s.setReauthMs);

  const reduced = useReducedMotion();
  const lastTickRef = useRef<number | null>(null);

  // Scripted walk while playing.
  useEffect(() => {
    if (!playing || reduced) return;
    const id = setTimeout(() => {
      const next = STRIPE_SCRIPT[step + 1];
      if (!next) {
        pause();
        return;
      }
      advance(next);
    }, 1100);
    return () => clearTimeout(id);
  }, [playing, step, reduced, pause, advance]);

  // Reauth countdown ticks only inside reauthorizing.
  useEffect(() => {
    if (current !== 'reauthorizing') {
      setReauthMs(REAUTH_TIMER_MS);
      lastTickRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (t: number) => {
      if (lastTickRef.current == null) lastTickRef.current = t;
      const dt = t - lastTickRef.current;
      lastTickRef.current = t;
      const ms = Math.max(0, useTemporalStripeStore.getState().reauthMs - dt);
      setReauthMs(ms);
      if (ms > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, setReauthMs]);

  useEffect(() => {
    if (!illegal) return;
    const id = setTimeout(clearIllegal, 320);
    return () => clearTimeout(id);
  }, [illegal, clearIllegal]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">temporal-stripe</h3>
          <p className="mt-1 text-xs text-muted">
            Temporal workflows for the Stripe Connect lifecycle
          </p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="relative mt-4 flex-1 overflow-hidden rounded-lg border border-border/60 bg-background/40">
        <svg
          viewBox="0 0 400 160"
          className="h-full w-full"
          role="img"
          aria-label="Stripe Connect state machine — authorize, reauth, multicapture, captured"
        >
          <defs>
            <marker
              id="ts-arrow"
              viewBox="0 0 6 6"
              refX="5"
              refY="3"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 z" fill="oklch(0.7 0.18 25 / 0.7)" />
            </marker>
          </defs>

          {STRIPE_EDGES.map((e) => {
            const from = STRIPE_NODE_BY_ID[e.from];
            const to = STRIPE_NODE_BY_ID[e.to];
            const active = current === e.to && step > 0;
            return (
              <motion.line
                key={`${e.from}-${e.to}`}
                x1={from.x + 30}
                y1={from.y}
                x2={to.x - 30}
                y2={to.y}
                stroke={active ? 'oklch(0.7 0.18 25)' : 'oklch(0.45 0 0)'}
                strokeWidth={active ? 1.8 : 1}
                strokeDasharray={active ? '0' : '3 3'}
                markerEnd="url(#ts-arrow)"
                initial={false}
                animate={{ opacity: active ? 1 : 0.55 }}
                transition={{ duration: 0.4 }}
              />
            );
          })}

          {STRIPE_NODES.map((n) => {
            const isCurrent = n.id === current;
            const isIllegal = illegal === n.id;
            return (
              <g
                key={n.id}
                onClick={() => jumpTo(n.id)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`jump to ${n.label}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpTo(n.id);
                  }
                }}
              >
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={isCurrent ? 14 : 11}
                  fill={
                    isIllegal
                      ? 'oklch(0.55 0.22 25 / 0.5)'
                      : isCurrent
                        ? 'oklch(0.65 0.18 25 / 0.9)'
                        : 'oklch(0.25 0 0)'
                  }
                  stroke={isCurrent ? 'oklch(0.85 0.16 25)' : 'oklch(0.45 0 0)'}
                  strokeWidth={isCurrent ? 1.6 : 1}
                  animate={
                    isIllegal && !reduced
                      ? { x: [0, -3, 3, -2, 2, 0] }
                      : isCurrent && !reduced
                        ? { scale: [1, 1.08, 1] }
                        : { scale: 1 }
                  }
                  transition={{ duration: isIllegal ? 0.32 : 0.6 }}
                />
                <text
                  x={n.x}
                  y={n.y + 28}
                  textAnchor="middle"
                  className="fill-current font-mono text-[8px]"
                  fill={isCurrent ? 'oklch(0.985 0 0)' : 'oklch(0.708 0 0)'}
                >
                  {n.label}
                </text>
              </g>
            );
          })}

          <AnimatePresence>
            {current === 'reauthorizing' && !reduced && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <circle
                  cx={310}
                  cy={40}
                  r={9}
                  fill="none"
                  stroke="oklch(0.3 0 0)"
                  strokeWidth={2}
                />
                <motion.circle
                  cx={310}
                  cy={40}
                  r={9}
                  fill="none"
                  stroke="oklch(0.7 0.18 25)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  initial={false}
                  animate={{ strokeDashoffset: 1 - reauthMs / REAUTH_TIMER_MS }}
                  transition={{ duration: 0.12, ease: 'linear' }}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '310px 40px' }}
                />
                <text
                  x={310}
                  y={66}
                  textAnchor="middle"
                  className="font-mono text-[8px]"
                  fill="oklch(0.708 0 0)"
                >
                  reauth in {(reauthMs / 1000).toFixed(1)}s
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div
        className="mt-3 flex items-center justify-between"
        role="group"
        aria-label="state machine controls"
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted" aria-live="polite">
          state · <span className="text-foreground">{current}</span>
          {STRIPE_TERMINAL.has(current) && <span className="ml-2 text-accent">final</span>}
        </p>
        <div className="flex gap-1.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={play}
            disabled={playing}
            className="rounded border border-border/60 px-1.5 py-0.5 text-muted hover:border-accent/40 hover:text-foreground disabled:opacity-40"
          >
            ▶ play
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!playing}
            className="rounded border border-border/60 px-1.5 py-0.5 text-muted hover:border-accent/40 hover:text-foreground disabled:opacity-40"
          >
            ⏸ pause
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded border border-border/60 px-1.5 py-0.5 text-muted hover:border-accent/40 hover:text-foreground"
          >
            ⟳ reset
          </button>
        </div>
      </div>
    </div>
  );
}
