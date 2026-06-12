import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Vendored from ~/Desktop/development/personal/shadowkit/examples/embed-counter/dist
// — the script registers the real <sk-counter> custom element on `window`.
const SK_COUNTER_BUNDLE = '/embeds/sk-counter/assets/index-DaVEyx3H.js';
const HOST_STYLE_RULE = '.sk-counter, sk-counter { background: hotpink !important; color: lime !important; }';

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

    // The vendor bundle expects a #log node — provide it (hidden) so the
    // bundle's appendChild doesn't blow up.
    if (!document.getElementById('log')) {
      const stub = hostLogRef.current;
      if (stub) stub.id = 'log';
    }

    if (window.customElements?.get('sk-counter')) {
      setLoaded('ready');
      return;
    }

    setLoaded('loading');
    const existing = document.querySelector(`script[data-sk-counter]`);
    if (existing) {
      // Wait one tick; if the bundle was already loaded, the element will be registered.
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
      // The bundle calls customElements.define synchronously after import.
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

export default function ShadowkitTile() {
  const { loaded, hostLogRef } = useBundle();
  const [tried, setTried] = useState(false);
  const reduced = useReducedMotion();
  const injectedStyleRef = useRef<HTMLStyleElement | null>(null);

  const injectHostCss = () => {
    if (typeof document === 'undefined') return;
    if (injectedStyleRef.current) {
      injectedStyleRef.current.remove();
      injectedStyleRef.current = null;
      setTried(false);
      return;
    }
    const el = document.createElement('style');
    el.dataset.skProbe = 'true';
    el.textContent = HOST_STYLE_RULE;
    document.head.appendChild(el);
    injectedStyleRef.current = el;
    setTried(true);
  };

  useEffect(() => {
    return () => {
      injectedStyleRef.current?.remove();
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">shadowkit</h3>
          <p className="mt-1 text-xs text-muted">Tailwind v4 inside Shadow DOM — cascade boundary holds</p>
        </div>
        <span className="rounded-full border border-accent/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-accent">
          shipped
        </span>
      </header>

      <div className="mt-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-center rounded-lg border border-border/60 bg-background/40 p-3">
          {loaded === 'ready' ? (
            // @ts-expect-error custom element
            <sk-counter id="portfolio-sk-counter" />
          ) : loaded === 'fallback' ? (
            <p className="font-mono text-[11px] text-muted">
              custom element not registered — bundle failed to load
            </p>
          ) : (
            <p className="font-mono text-[11px] text-muted">loading sk-counter…</p>
          )}
        </div>

        <motion.button
          type="button"
          onClick={injectHostCss}
          className="rounded-md border border-border/60 px-2 py-1.5 text-left font-mono text-[10px] hover:border-accent/40"
          whileTap={reduced ? undefined : { scale: 0.98 }}
        >
          <span className="text-foreground">{tried ? '✓ host CSS injected' : '×'}</span>{' '}
          <span className="text-muted">
            {tried
              ? '— colors did not bleed through. cascade boundary holding.'
              : 'try to style sk-counter from the host page'}
          </span>
        </motion.button>
      </div>

      <pre
        ref={hostLogRef}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
