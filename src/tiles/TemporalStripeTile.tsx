import { useEffect, useRef } from 'react';
import {
  dwellMs,
  isLegalTransition,
  REAUTH_TIMER_MS,
  STRIPE_EDGES,
  STRIPE_NODE_BY_ID,
  STRIPE_NODES,
  STRIPE_TERMINAL,
  type StripeState,
  useTemporalStripeStore,
} from '~/lib/temporalStripeStore';

const NODE_R = 11;
const CURRENT_R = 14;

/** Edge endpoints trimmed to the node circles; two-way edges are split apart. */
function edgeLine(from: StripeState, to: StripeState) {
  const a = STRIPE_NODE_BY_ID[from];
  const b = STRIPE_NODE_BY_ID[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const offset = isLegalTransition(to, from) ? 4 : 0;
  const nx = -uy * offset;
  const ny = ux * offset;
  return {
    x1: a.x + ux * (CURRENT_R + 3) + nx,
    y1: a.y + uy * (CURRENT_R + 3) + ny,
    x2: b.x - ux * (CURRENT_R + 5) + nx,
    y2: b.y - uy * (CURRENT_R + 5) + ny,
  };
}

function labelProps(node: (typeof STRIPE_NODES)[number]) {
  switch (node.labelPos) {
    case 'above':
      return { x: node.x, y: node.y - 20, textAnchor: 'middle' as const };
    case 'right':
      return { x: node.x + 20, y: node.y + 3, textAnchor: 'start' as const };
    default:
      return { x: node.x, y: node.y + 27, textAnchor: 'middle' as const };
  }
}

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

  const lastTickRef = useRef<number | null>(null);

  // Scripted walk while playing. Reduced motion only removes the animation
  // (via CSS) — the walk itself still runs.
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(advance, dwellMs(current));
    return () => clearTimeout(id);
  }, [playing, step, current, advance]);

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

  const reauthNode = STRIPE_NODE_BY_ID.reauthorizing;

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="relative flex-1 overflow-hidden rounded-lg border border-border/60 bg-background/40">
        <svg
          viewBox="0 0 400 170"
          className="h-full w-full"
          role="group"
          aria-label="Stripe Connect state machine. Select a state to transition to it."
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
            const active = current === e.to && step > 0;
            return (
              <line
                key={`${e.from}-${e.to}`}
                {...edgeLine(e.from, e.to)}
                stroke={active ? 'oklch(0.7 0.18 25)' : 'oklch(0.45 0 0)'}
                strokeWidth={active ? 1.8 : 1}
                strokeDasharray={active ? '0' : '3 3'}
                markerEnd="url(#ts-arrow)"
                opacity={active ? 1 : 0.55}
                className="transition-opacity duration-300"
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
                aria-label={`${n.label}${isCurrent ? ' (current state)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpTo(n.id);
                  }
                }}
              >
                <circle
                  // Re-keying restarts the CSS animation on every state change.
                  key={`${n.id}-${isCurrent}-${isIllegal}`}
                  cx={n.x}
                  cy={n.y}
                  r={isCurrent ? CURRENT_R : NODE_R}
                  fill={
                    isIllegal
                      ? 'oklch(0.55 0.22 25 / 0.5)'
                      : isCurrent
                        ? 'oklch(0.65 0.18 25 / 0.9)'
                        : 'oklch(0.25 0 0)'
                  }
                  stroke={isCurrent ? 'oklch(0.85 0.16 25)' : 'oklch(0.45 0 0)'}
                  strokeWidth={isCurrent ? 1.6 : 1}
                  className={isIllegal ? 'anim-shake' : isCurrent ? 'anim-beat' : undefined}
                />
                <text
                  {...labelProps(n)}
                  className="font-mono text-[8px]"
                  fill={isCurrent ? 'oklch(0.985 0 0)' : 'oklch(0.708 0 0)'}
                >
                  {n.label}
                </text>
              </g>
            );
          })}

          {current === 'reauthorizing' && (
            <g className="anim-enter">
              <circle
                cx={reauthNode.x + 32}
                cy={reauthNode.y}
                r={7}
                fill="oklch(0.145 0 0)"
                stroke="oklch(0.3 0 0)"
                strokeWidth={1.5}
              />
              <circle
                cx={reauthNode.x + 32}
                cy={reauthNode.y}
                r={7}
                fill="none"
                stroke="oklch(0.7 0.18 25)"
                strokeWidth={1.5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - reauthMs / REAUTH_TIMER_MS}
                transform={`rotate(-90 ${reauthNode.x + 32} ${reauthNode.y})`}
              />
              <text
                x={reauthNode.x + 44}
                y={reauthNode.y + 3}
                className="font-mono text-[7px]"
                fill="oklch(0.708 0 0)"
              >
                reauth in {(reauthMs / 1000).toFixed(1)}s
              </text>
            </g>
          )}
        </svg>
      </div>

      <div
        className="mt-3 flex items-center justify-between"
        role="group"
        aria-label="state machine controls"
      >
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted" aria-live="polite">
          state · <span className="text-foreground">{current}</span>
          {STRIPE_TERMINAL.has(current) && <span className="ml-2 text-accent">final</span>}
        </p>
        <div className="flex shrink-0 gap-1.5 whitespace-nowrap font-mono text-[11px]">
          <button
            type="button"
            onClick={play}
            disabled={playing}
            className="min-h-7 rounded border border-border/60 px-2.5 py-1 text-muted hover:border-accent/40 hover:text-foreground disabled:opacity-40"
          >
            ▶ play
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!playing}
            className="min-h-7 rounded border border-border/60 px-2.5 py-1 text-muted hover:border-accent/40 hover:text-foreground disabled:opacity-40"
          >
            ⏸ pause
          </button>
          <button
            type="button"
            onClick={reset}
            className="min-h-7 rounded border border-border/60 px-2.5 py-1 text-muted hover:border-accent/40 hover:text-foreground"
          >
            ⟳ reset
          </button>
        </div>
      </div>
    </div>
  );
}
