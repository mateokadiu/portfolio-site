import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Vendored from ~/Desktop/development/personal/shadowkit/examples/embed-counter/dist
// — the script registers the real <sk-counter> custom element on `window`.
const SK_COUNTER_BUNDLE = '/embeds/sk-counter/assets/index-DaVEyx3H.js';
const HOST_STYLE_RULE =
  '.sk-counter, sk-counter, sk-counter * { background: hotpink !important; color: lime !important; }';
const HOST_DESCENDANT_RULE =
  'body * { background: hotpink !important; color: lime !important; outline: 2px solid red !important; }';

declare global {
  interface HTMLElementTagNameMap {
    'sk-counter': HTMLElement;
  }
}

function useBundle() {
  const [loaded, setLoaded] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');
  const hostLogRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (loaded !== 'idle') return;
    if (typeof window === 'undefined') return;

    if (!document.getElementById('log')) {
      const stub = hostLogRef.current;
      if (stub) stub.id = 'log';
    }

    if (window.customElements?.get('sk-counter')) {
      setLoaded('ready');
      return;
    }

    setLoaded('loading');
    const existing = document.querySelector('script[data-sk-counter]');
    if (existing) {
      const check = () => {
        if (window.customElements?.get('sk-counter')) setLoaded('ready');
        else setLoaded('fallback');
      };
      setTimeout(check, 200);
      return;
    }

    const s = document.createElement('script');
    s.type = 'module';
    s.src = SK_COUNTER_BUNDLE;
    s.dataset.skCounter = 'true';
    s.onload = () => {
      requestAnimationFrame(() => {
        if (window.customElements?.get('sk-counter')) setLoaded('ready');
        else setLoaded('fallback');
      });
    };
    s.onerror = () => setLoaded('fallback');
    document.head.appendChild(s);
  }, [loaded]);

  return { loaded, hostLogRef };
}

type ProbeKey = 'css' | 'descendant';

interface ProbeRowProps {
  active: boolean;
  label: string;
  onText: string;
  offText: string;
  onClick: () => void;
}

function ProbeRow({ active, label, onText, offText, onClick }: ProbeRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-left font-mono text-[10px] transition-colors hover:border-accent/40"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] ${
          active ? 'bg-accent text-background' : 'bg-border/60 text-muted'
        }`}
        aria-hidden="true"
      >
        {active ? '✓' : ''}
      </span>
      <span className="flex-1 truncate">
        <span className="text-foreground">{label}:</span>{' '}
        <span className="text-muted">{active ? onText : offText}</span>
      </span>
    </button>
  );
}

export default function ShadowkitTile() {
  const { loaded, hostLogRef } = useBundle();
  const [active, setActive] = useState<Set<ProbeKey>>(new Set());
  const reduced = useReducedMotion();
  const styleRefs = useRef<Record<ProbeKey, HTMLStyleElement | null>>({
    css: null,
    descendant: null,
  });

  const toggle = (key: ProbeKey, rule: string) => {
    if (typeof document === 'undefined') return;
    const isOn = active.has(key);
    if (isOn) {
      styleRefs.current[key]?.remove();
      styleRefs.current[key] = null;
      setActive((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
      return;
    }
    const el = document.createElement('style');
    el.dataset.skProbe = key;
    el.textContent = rule;
    document.head.appendChild(el);
    styleRefs.current[key] = el;
    setActive((s) => new Set(s).add(key));
  };

  useEffect(() => {
    return () => {
      for (const k of ['css', 'descendant'] as ProbeKey[]) {
        styleRefs.current[k]?.remove();
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">shadowkit</h3>
          <p className="mt-1 text-xs text-muted">
            Tailwind v4 inside Shadow DOM — cascade boundary holds
          </p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            3 shadow roots · synced through a typed postMessage bridge
          </p>
          {loaded === 'ready' ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                // @ts-expect-error custom element
                <sk-counter key={i} id={`sk-${i}`} />
              ))}
            </div>
          ) : loaded === 'fallback' ? (
            <p className="font-mono text-[11px] text-muted">
              custom element not registered — bundle failed to load
            </p>
          ) : (
            <p className="font-mono text-[11px] text-muted">loading sk-counter…</p>
          )}
        </div>

        <motion.div
          className="space-y-1.5"
          initial={false}
          animate={reduced ? undefined : { opacity: 1 }}
        >
          <ProbeRow
            active={active.has('css')}
            label="inject host CSS"
            onText="rule applied — counter unchanged (boundary holding)"
            offText="try to repaint sk-counter from outside"
            onClick={() => toggle('css', HOST_STYLE_RULE)}
          />
          <ProbeRow
            active={active.has('descendant')}
            label="paint every host element"
            onText="rule applied — every host element is pink + lime, sk-counter unchanged"
            offText="try a body * !important that nukes every element on the page"
            onClick={() => toggle('descendant', HOST_DESCENDANT_RULE)}
          />
        </motion.div>
      </div>

      <pre ref={hostLogRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
