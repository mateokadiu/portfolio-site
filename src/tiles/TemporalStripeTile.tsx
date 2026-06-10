import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { create } from 'zustand';

type State =
  | 'authorized'
  | 'reauthorizing'
  | 'revising'
  | 'multicapture'
  | 'captured'
  | 'canceled';

const NODES: Array<{ id: State; x: number; y: number; label: string }> = [
  { id: 'authorized', x: 60, y: 40, label: 'authorized' },
  { id: 'reauthorizing', x: 200, y: 40, label: 'reauthorizing' },
  { id: 'revising', x: 60, y: 110, label: 'revising' },
  { id: 'multicapture', x: 200, y: 110, label: 'multicapture' },
  { id: 'captured', x: 330, y: 110, label: 'captured' },
  { id: 'canceled', x: 330, y: 40, label: 'canceled' },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<
  State,
  (typeof NODES)[number]
>;

const EDGES: Array<{ from: State; to: State }> = [
  { from: 'authorized', to: 'reauthorizing' },
  { from: 'reauthorizing', to: 'authorized' },
  { from: 'authorized', to: 'revising' },
  { from: 'revising', to: 'multicapture' },
  { from: 'authorized', to: 'multicapture' },
  { from: 'multicapture', to: 'captured' },
  { from: 'authorized', to: 'canceled' },
];

const LEGAL = new Set(EDGES.map((e) => `${e.from}->${e.to}`));
const TERMINAL: Set<State> = new Set(['captured', 'canceled']);
const SCRIPTED: State[] = [
  'authorized',
  'reauthorizing',
  'authorized',
  'multicapture',
  'multicapture',
  'captured',
];

interface Store {
  current: State;
  reauthMs: number;
  step: number;
  playing: boolean;
  illegal: State | null;
  set: (s: Partial<Store>) => void;
}

const useMachine = create<Store>((set) => ({
  current: 'authorized',
  reauthMs: 4000,
  step: 0,
  playing: false,
  illegal: null,
  set: (patch) => set((s) => ({ ...s, ...patch })),
}));

function isLegal(from: State, to: State) {
  return LEGAL.has(`${from}->${to}`);
}

export default function TemporalStripeTile() {
  const { current, reauthMs, step, playing, illegal, set } = useMachine();
  const reduced = useReducedMotion();
  const lastTickRef = useRef<number | null>(null);

  // Scripted walker — advances through SCRIPTED on each play tick.
  useEffect(() => {
    if (!playing || reduced) return;
    const id = setTimeout(() => {
      const next = SCRIPTED[step + 1];
      if (!next) {
        set({ playing: false });
        return;
      }
      set({ current: next, step: step + 1 });
    }, 1100);
    return () => clearTimeout(id);
  }, [playing, step, reduced, set]);

  // Reauth countdown — only ticks while we're in `reauthorizing`.
  useEffect(() => {
    if (current !== 'reauthorizing') {
      set({ reauthMs: 4000 });
      lastTickRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (t: number) => {
      if (lastTickRef.current == null) lastTickRef.current = t;
      const dt = t - lastTickRef.current;
      lastTickRef.current = t;
      const ms = Math.max(0, useMachine.getState().reauthMs - dt);
      set({ reauthMs: ms });
      if (ms > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, set]);

  // Illegal-transition red flash auto-clears.
  useEffect(() => {
    if (!illegal) return;
    const id = setTimeout(() => set({ illegal: null }), 320);
    return () => clearTimeout(id);
  }, [illegal, set]);

  const handleNodeClick = (id: State) => {
    if (id === current) return;
    if (!isLegal(current, id)) {
      set({ illegal: id });
      return;
    }
    set({ current: id, playing: false });
  };

  const play = () => set({ playing: true });
  const pause = () => set({ playing: false });
  const reset = () =>
    set({ current: 'authorized', step: 0, playing: false, reauthMs: 4000, illegal: null });

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

          {EDGES.map((e) => {
            const from = NODE_BY_ID[e.from];
            const to = NODE_BY_ID[e.to];
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
                animate={{
                  opacity: active ? 1 : 0.55,
                }}
                transition={{ duration: 0.4 }}
              />
            );
          })}

          {NODES.map((n) => {
            const isCurrent = n.id === current;
            const isIllegal = illegal === n.id;
            return (
              <g
                key={n.id}
                onClick={() => handleNodeClick(n.id)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleNodeClick(n.id);
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
                  stroke={
                    isCurrent ? 'oklch(0.85 0.16 25)' : 'oklch(0.45 0 0)'
                  }
                  strokeWidth={isCurrent ? 1.6 : 1}
                  animate={
                    isIllegal && !reduced
                      ? { x: [0, -3, 3, -2, 2, 0] }
                      : isCurrent && !reduced
                        ? { scale: [1, 1.08, 1] }
                        : { scale: 1 }
                  }
                  transition={{ duration: isIllegal ? 0.32 : 0.6, repeat: 0 }}
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
                <circle cx={310} cy={40} r={9} fill="none" stroke="oklch(0.3 0 0)" strokeWidth={2} />
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
                  animate={{ strokeDashoffset: 1 - reauthMs / 4000 }}
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
        <p
          className="font-mono text-[10px] uppercase tracking-wider text-muted"
          aria-live="polite"
        >
          state · <span className="text-foreground">{current}</span>
          {TERMINAL.has(current) && <span className="ml-2 text-accent">final</span>}
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
