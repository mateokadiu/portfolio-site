import { useState } from 'react';
import { cssVars } from '~/lib/cssVars';
import { EU27_VAT, bpToPercent } from '~/lib/vat-rates';

const NET_EUR = 100;
const fmt = (n: number) => `€${n.toFixed(2)}`;

// Featured chips — six representative economies; full matrix remains 27.
const FEATURED = ['DE', 'FR', 'IT', 'ES', 'FI', 'HU'];

const FALLBACK = EU27_VAT[0]!;

export default function MossTile() {
  const [picked, setPicked] = useState('DE');
  const member = EU27_VAT.find((m) => m.code === picked) ?? FALLBACK;
  const ratePct = bpToPercent(member.rateBp);
  const vat = NET_EUR * (ratePct / 100);
  const gross = NET_EUR + vat;

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="mb-2 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
            <span>customer in</span>
            <span>{EU27_VAT.length} member states · standard rates</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FEATURED.map((code) => {
              const m = EU27_VAT.find((r) => r.code === code);
              if (!m) return null;
              const active = m.code === picked;
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setPicked(m.code)}
                  className={`min-h-6 rounded-md border px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    active
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : 'border-border/60 text-muted hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  <span className="mr-1" aria-hidden="true">
                    {m.flag}
                  </span>
                  {m.code}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between text-muted">
            <span>net</span>
            <span className="text-foreground">{fmt(NET_EUR)}</span>
          </div>
          <div
            key={member.code}
            className="anim-enter mt-1.5 flex items-center justify-between text-muted"
            style={cssVars({ '--enter-y': '-4px' })}
          >
            <span>
              vat <span className="text-foreground">{ratePct.toFixed(1)}%</span>{' '}
              <span className="text-[11px]">→ {member.code} treasury</span>
            </span>
            <span className="text-foreground">+ {fmt(vat)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-foreground">
            <span className="text-muted">customer pays</span>
            <span
              key={`gross-${member.code}`}
              className="anim-enter inline-block font-semibold"
              style={cssVars({ '--enter-y': '0', '--enter-scale': 0.96 })}
            >
              {fmt(gross)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded border border-border/60 bg-card px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span>
            period <span className="text-foreground">2026-Q2</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_oklch(0.65_0.18_25)]" />
            <span className="text-accent">saf-oss ready</span>
          </span>
        </div>
      </div>
    </div>
  );
}
