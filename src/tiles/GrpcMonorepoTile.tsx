import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

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
  const reduced = useReducedMotion();
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
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">grpc-monorepo-starter</h3>
          <p className="mt-1 text-xs text-muted">proto → TS / Go / Python / Connect-Web on save</p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex-1 space-y-3">
        <pre
          className="rounded-lg border border-border/60 bg-background/60 p-2.5 font-mono text-[10px] leading-snug text-foreground"
          aria-live="polite"
        >
          <code>
            {PROTO_LINES.map((line, i) => (
              <div key={`${run}-${i}`} className="whitespace-pre">
                {i < lineIdx ? line : i === lineIdx ? line.slice(0, charIdx) : ''}
                {i === lineIdx && !done && (
                  <motion.span
                    aria-hidden="true"
                    className="inline-block w-[6px] bg-accent/80"
                    style={{ height: '0.85em', marginLeft: 1, verticalAlign: 'text-bottom' }}
                    animate={reduced ? undefined : { opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                  />
                )}
              </div>
            ))}
          </code>
        </pre>

        <div className="grid grid-cols-4 gap-1.5">
          {CLIENTS.map((c, i) => (
            <motion.div
              key={`${run}-${c.key}`}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={done ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 8 }}
              transition={{
                delay: reduced ? 0 : (i + 1) * 0.18,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-center justify-between rounded border border-border/60 bg-card px-2 py-1.5 font-mono text-[10px]"
            >
              <span className="text-foreground">{c.label}</span>
              <AnimatePresence>
                {done && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{
                      delay: reduced ? 0 : (i + 1) * 0.18,
                      type: 'spring',
                      stiffness: 360,
                      damping: 22,
                    }}
                    className="text-accent"
                    aria-label="generated"
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted">
        <span>{done ? '4 clients regenerated' : 'codegen…'}</span>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="rounded border border-border/60 px-1.5 py-0.5 hover:border-accent/40 hover:text-foreground"
        >
          ▶ replay
        </button>
      </div>
    </div>
  );
}
