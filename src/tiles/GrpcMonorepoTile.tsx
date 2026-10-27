import { useEffect, useState } from 'react';
import { cssVars } from '~/lib/cssVars';
import { usePrefersReducedMotion } from '~/lib/usePrefersReducedMotion';

const PROTO_LINES = [
  'service Orders {',
  '  rpc Create(CreateOrderReq)',
  '    returns (Order);',
  '  rpc Get(GetOrderReq)',
  '    returns (Order);',
  '}',
];

const CLIENTS = [
  { key: 'ts', label: 'TS' },
  { key: 'go', label: 'Go' },
  { key: 'py', label: 'Py' },
  { key: 'web', label: 'Web' },
];

const TYPING_MS = 22; // per char
const PER_LINE_PAUSE = 100;

export default function GrpcMonorepoTile() {
  const reduced = usePrefersReducedMotion();
  const [run, setRun] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Per-line typewriter — schedule the next char/line until exhausted.
  useEffect(() => {
    if (done) return;
    if (reduced) {
      setLineIdx(PROTO_LINES.length);
      setDone(true);
      return;
    }
    const currentLine = PROTO_LINES[lineIdx];
    if (currentLine == null) {
      setDone(true);
      return;
    }
    if (charIdx < currentLine.length) {
      const id = setTimeout(() => setCharIdx((c) => c + 1), TYPING_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setLineIdx((l) => l + 1);
      setCharIdx(0);
    }, PER_LINE_PAUSE);
    return () => clearTimeout(id);
  }, [lineIdx, charIdx, done, reduced]);

  // Reset on replay.
  useEffect(() => {
    setLineIdx(0);
    setCharIdx(0);
    setDone(false);
  }, [run]);

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 space-y-3">
        <pre
          className="rounded-lg border border-border/60 bg-background/60 p-2.5 font-mono text-[11px] leading-snug text-foreground"
          aria-label="orders.proto"
        >
          <code>
            {PROTO_LINES.map((line, i) => (
              <div key={`${run}-${i}`} className="whitespace-pre">
                {i < lineIdx ? line : i === lineIdx ? line.slice(0, charIdx) : ''}
                {i === lineIdx && !done && (
                  <span
                    aria-hidden="true"
                    className="anim-blink inline-block w-[6px] bg-accent/80"
                    style={{ height: '0.85em', marginLeft: 1, verticalAlign: 'text-bottom' }}
                  />
                )}
              </div>
            ))}
          </code>
        </pre>

        <div className="grid grid-cols-4 gap-1.5">
          {CLIENTS.map((c, i) => (
            <div
              key={`${run}-${c.key}`}
              className={`flex items-center justify-between rounded border border-border/60 bg-card px-2 py-1.5 font-mono text-[11px] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                done
                  ? 'translate-y-0 border-border/60'
                  : 'translate-y-2 border-dashed border-border/60'
              }`}
              style={{ transitionDelay: done ? `${(i + 1) * 180}ms` : '0ms' }}
            >
              <span className={done ? 'text-foreground' : 'text-muted'}>{c.label}</span>
              {done && (
                <span
                  className="anim-enter text-accent"
                  style={cssVars({
                    '--enter-y': '0',
                    '--enter-scale': 0.4,
                    '--delay': `${(i + 1) * 180}ms`,
                  })}
                >
                  <span aria-hidden="true">✓</span>
                  <span className="sr-only">generated</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted">
        <span aria-live="polite">{done ? '4 clients regenerated' : 'codegen…'}</span>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="min-h-6 rounded border border-border/60 px-1.5 py-0.5 hover:border-accent/40 hover:text-foreground"
        >
          ▶ replay
        </button>
      </div>
    </div>
  );
}
