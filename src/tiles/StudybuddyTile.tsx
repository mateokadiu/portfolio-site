import { type KeyboardEvent, type PointerEvent, useEffect, useId, useRef, useState } from 'react';
import { DAYS, WEEKS, buildHeatmap, formatCellDate, monthLabels, summarize } from '~/lib/heatmap';

const CELL = 6;
const GAP = 2;
const PITCH = CELL + GAP;
const WIDTH = WEEKS * PITCH;
const HEIGHT = DAYS * PITCH;

const LEVEL_COLORS = [
  'oklch(0.2 0 0)',
  'oklch(0.32 0.05 25)',
  'oklch(0.45 0.1 25)',
  'oklch(0.58 0.15 25)',
  'oklch(0.72 0.18 25)',
];

const CELLS = buildHeatmap(42);
const MONTH_LABELS = monthLabels();
const SUMMARY = summarize(CELLS);
const BUSIEST_LABEL = formatCellDate(SUMMARY.busiest.date);

const KEY_STEP: Record<string, number> = {
  ArrowLeft: -DAYS,
  ArrowRight: DAYS,
  ArrowUp: -1,
  ArrowDown: 1,
};

export default function StudybuddyTile() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // Cells stay paused (invisible) until hydration, then fade in — so the
  // stagger plays when the tile scrolls into view, not before.
  const [ready, setReady] = useState(false);
  const summaryId = useId();

  useEffect(() => setReady(true), []);

  const cell = selected == null ? null : CELLS[selected];

  const selectAt = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const week = Math.floor(point.x / PITCH);
    const day = Math.floor(point.y / PITCH);
    if (week >= 0 && week < WEEKS && day >= 0 && day < DAYS) setSelected(week * DAYS + day);
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'Escape') {
      setSelected(null);
      return;
    }
    const delta = KEY_STEP[e.key];
    if (delta == null) return;
    e.preventDefault();
    setSelected((current) => {
      if (current == null) return 0;
      const next = current + delta;
      // Up/down stay inside the week column; left/right stay inside the grid.
      if (Math.abs(delta) === 1 && Math.floor(next / DAYS) !== Math.floor(current / DAYS)) {
        return current;
      }
      return next >= 0 && next < CELLS.length ? next : current;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">studybuddy</h3>
          <p className="mt-1 text-xs text-muted">on-device RAG study app · review heatmap</p>
        </div>
        <span className="rounded-full border border-border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-muted">
          beta
        </span>
      </header>

      <div className="relative mt-4 flex-1" data-ready={ready || undefined}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT + 14}`}
          className="h-full w-full touch-pan-y rounded"
          preserveAspectRatio="xMidYMid meet"
          role="application"
          aria-roledescription="heatmap"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: custom 2-D keyboard widget — arrow keys move a day cursor
          tabIndex={0}
          aria-label="Review heatmap, one cell per day. Use arrow keys to inspect days."
          aria-describedby={summaryId}
          data-tile-interactive
          onPointerMove={selectAt}
          onPointerDown={selectAt}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setSelected(null);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setSelected((s) => s ?? CELLS.indexOf(SUMMARY.busiest))}
          onBlur={() => setSelected(null)}
        >
          {CELLS.map((c, i) => (
            <rect
              key={c.date}
              x={c.week * PITCH}
              y={c.day * PITCH}
              width={CELL}
              height={CELL}
              rx={1.5}
              fill={LEVEL_COLORS[c.level]}
              className="heat-cell"
              style={{ animationDelay: `${Math.min(i, 200) * 4}ms` }}
            />
          ))}
          {cell && (
            <rect
              x={cell.week * PITCH - 1}
              y={cell.day * PITCH - 1}
              width={CELL + 2}
              height={CELL + 2}
              rx={2}
              fill="none"
              stroke="oklch(0.985 0 0)"
              strokeWidth={1}
              pointerEvents="none"
            />
          )}
          {MONTH_LABELS.map((m) => (
            <text
              key={`${m.label}-${m.week}`}
              x={m.week * PITCH}
              y={HEIGHT + 10}
              className="font-mono"
              fill="oklch(0.6 0 0)"
              fontSize="7"
            >
              {m.label}
            </text>
          ))}
        </svg>
        <p
          className={`pointer-events-none absolute right-0 top-0 rounded bg-card px-2 py-1 font-mono text-[11px] text-foreground shadow ${
            cell ? '' : 'sr-only'
          }`}
          aria-live="polite"
        >
          {cell &&
            `${formatCellDate(cell.date)} · ${cell.count} ${cell.count === 1 ? 'review' : 'reviews'}`}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-muted">
        <span id={summaryId} className="mr-auto">
          {SUMMARY.total.toLocaleString('en-US')} reviews · busiest {BUSIEST_LABEL}
        </span>
        <span aria-hidden="true">less</span>
        {LEVEL_COLORS.map((c) => (
          <span
            key={c}
            style={{ background: c }}
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm"
          />
        ))}
        <span aria-hidden="true">more</span>
      </div>
    </div>
  );
}
