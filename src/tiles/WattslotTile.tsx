import { type KeyboardEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useIsActive } from '~/lib/useIsActive';
import {
  cheapestWindow,
  clock,
  dayLabel,
  type Level,
  levels,
  type PriceDay,
  parsePrices,
  pricesUrl,
  SAMPLE,
  slotAt,
  slotEnd,
} from '~/lib/wattslot';

const LEVEL_COLORS: Record<Level, string> = {
  cheap: 'oklch(0.72 0.15 160)',
  normal: 'oklch(0.78 0.14 75)',
  expensive: 'oklch(0.66 0.2 25)',
};
const LEGEND: Level[] = ['cheap', 'normal', 'expensive'];
/** A dishwasher run: two hours, back to back. */
const WINDOW_SLOTS = 8;
const TICKS = ['00:00', '06:00', '12:00', '18:00'];

const KEY_STEP: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  PageUp: -4,
  PageDown: 4,
};

const money = (value: number) => value.toFixed(2);

export default function WattslotTile() {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useIsActive(rootRef);
  const [day, setDay] = useState<PriceDay>(SAMPLE);
  const [live, setLive] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  // Today's real prices replace the sample when the API answers; any failure keeps the sample.
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);
    fetch(pricesUrl(Date.now()), { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const parsed = parsePrices(json);
        if (parsed) {
          setDay(parsed);
          setLive(true);
          setSelected(null);
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [active]);

  const n = day.totals.length;
  const tiers = useMemo(() => levels(day.totals), [day]);
  const best = useMemo(() => cheapestWindow(day, WINDOW_SLOTS), [day]);
  const peak = useMemo(() => day.totals.indexOf(Math.max(...day.totals)), [day]);
  const max = (day.totals[peak] as number) * 1.05;
  const ticks = useMemo(
    () =>
      day.starts.flatMap((start, i) =>
        TICKS.includes(clock(start)) ? [{ i, label: clock(start) }] : [],
      ),
    [day],
  );
  const current = live && nowMs !== null ? slotAt(day, nowMs) : -1;
  // The readout follows the cursor; otherwise it shows now (live) or the day's peak.
  const marked = selected ?? (current >= 0 ? current : null);
  const shown = marked ?? peak;
  const tag = selected !== null ? '' : current >= 0 ? 'now · ' : 'peak · ';

  const valueText = (i: number) =>
    `${clock(day.starts[i] as number)}–${clock(slotEnd(day.starts[i] as number))}, ${money(day.totals[i] as number)} DKK per kWh, ${tiers[i]}`;

  const selectAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - rect.left) / rect.width) * n);
    if (i >= 0 && i < n) setSelected(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setSelected(null);
      return;
    }
    const start = marked ?? peak;
    let next: number | null = null;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (KEY_STEP[e.key] != null) next = Math.min(n - 1, Math.max(0, start + KEY_STEP[e.key]!));
    if (next === null) return;
    e.preventDefault();
    setSelected(next);
  };

  const pct = (i: number) => `${(i / n) * 100}%`;
  const nowOffset =
    current >= 0 && nowMs !== null
      ? `${((current + (nowMs - (day.starts[current] as number)) / 900_000) / n) * 100}%`
      : null;

  return (
    <div ref={rootRef} className="flex h-full flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div aria-live="polite">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {tag}
            {clock(day.starts[shown] as number)}–{clock(slotEnd(day.starts[shown] as number))}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {money(day.totals[shown] as number)}
            <span className="ml-1.5 text-xs font-normal text-muted">DKK/kWh</span>
            <span
              className="ml-2 align-middle text-[11px] font-normal"
              style={{ color: LEVEL_COLORS[tiers[shown] as Level] }}
            >
              {tiers[shown]}
            </span>
          </p>
        </div>
        {best && (
          <div className="sm:text-right">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              cheapest 2 h
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums">
              {clock(day.starts[best.from] as number)}–
              {clock(slotEnd(day.starts[best.from + best.length - 1] as number))}
              <span className="ml-1.5 text-muted">avg {money(best.average)}</span>
            </p>
          </div>
        )}
      </div>

      <div className="relative min-h-28 flex-1">
        <div
          role="slider"
          tabIndex={0}
          aria-label="All-in electricity price per quarter hour"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={shown}
          aria-valuetext={valueText(shown)}
          data-tile-interactive
          className="absolute inset-0 touch-pan-y rounded outline-offset-4"
          onPointerMove={selectAt}
          onPointerDown={selectAt}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setSelected(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setSelected(null)}
        >
          {best && (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 rounded-sm border-t-2"
              style={{
                left: pct(best.from),
                width: pct(best.length),
                borderColor: LEVEL_COLORS.cheap,
                background: 'oklch(0.72 0.15 160 / 0.12)',
              }}
            />
          )}
          {marked !== null && (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 bg-foreground/10"
              style={{ left: pct(marked), width: pct(1) }}
            />
          )}
          <svg
            viewBox={`0 0 ${n} 100`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {day.totals.map((total, i) => {
              const h = (total / max) * 100;
              return (
                <rect
                  key={day.starts[i]}
                  x={i + 0.14}
                  y={100 - h}
                  width={0.72}
                  height={h}
                  fill={LEVEL_COLORS[tiers[i] as Level]}
                  opacity={selected === null || selected === i ? 1 : 0.55}
                />
              );
            })}
          </svg>
          {nowOffset && (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 w-px bg-foreground"
              style={{ left: nowOffset }}
            />
          )}
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 -bottom-5 h-4">
          {ticks.map((t) => (
            <span
              key={t.i}
              className="absolute font-mono text-[10px] text-muted"
              style={{ left: pct(t.i) }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px] text-muted">
        <span className="mr-auto">
          {live ? (
            <span className="text-foreground/90">
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: LEVEL_COLORS.cheap }}
              />
              live
            </span>
          ) : (
            'sample'
          )}{' '}
          · {dayLabel(day.starts[0] as number)} · {day.zone}
          {day.company ? ` · ${day.company}` : ''} ·{' '}
          {day.mode === 'full' ? 'all-in incl. VAT' : 'spot price only'}
        </span>
        {LEGEND.map((level) => (
          <span key={level} className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: LEVEL_COLORS[level] }}
            />
            {level}
          </span>
        ))}
      </div>
    </div>
  );
}
