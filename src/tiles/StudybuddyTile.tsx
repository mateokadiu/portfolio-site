import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { mulberry32 } from '~/lib/seededRandom';

const WEEKS = 53;
const DAYS = 7;
const CELL = 6;
const GAP = 2;
const WIDTH = WEEKS * (CELL + GAP);
const HEIGHT = DAYS * (CELL + GAP);

// Deterministic year-of-reviews fixture.
function buildHeatmap(seed: number) {
  const rand = mulberry32(seed);
  const cells: Array<{ w: number; d: number; level: number; count: number }> = [];
  // The cluster pattern: dense in winter (study season), light in summer, no Sundays-of-vacation gap.
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      const seasonal = Math.cos((w / WEEKS) * Math.PI * 2 + Math.PI) * 0.4 + 0.5; // 0..1
      const base = seasonal * rand();
      const lull = w > 18 && w < 32 ? 0.4 : 1;
      const v = base * lull * 60;
      let level = 0;
      if (v > 4) level = 1;
      if (v > 14) level = 2;
      if (v > 28) level = 3;
      if (v > 44) level = 4;
      cells.push({ w, d, level, count: Math.round(v) });
    }
  }
  return cells;
}

const LEVEL_COLORS = [
  'oklch(0.2 0 0)',
  'oklch(0.32 0.05 25)',
  'oklch(0.45 0.1 25)',
  'oklch(0.58 0.15 25)',
  'oklch(0.72 0.18 25)',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dateForCell = (w: number, d: number) => {
  const start = new Date(2025, 5, 1); // arbitrary anchor
  const dt = new Date(start);
  dt.setDate(start.getDate() + w * 7 + d);
  return dt;
};

export default function StudybuddyTile() {
  const cells = useMemo(() => buildHeatmap(42), []);
  const [hover, setHover] = useState<{ w: number; d: number; count: number } | null>(null);
  const reduced = useReducedMotion();

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

      <div className="relative mt-4 flex-1" onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT + 14}`}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="A year of review activity — heatmap"
        >
          {cells.map((c, i) => (
            <motion.rect
              key={`${c.w}-${c.d}`}
              x={c.w * (CELL + GAP)}
              y={c.d * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={1.5}
              fill={LEVEL_COLORS[c.level]}
              initial={reduced ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: reduced ? 0 : Math.min(i, 200) * 0.004,
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              onMouseEnter={() => setHover({ w: c.w, d: c.d, count: c.count })}
            >
              <title>
                {dateForCell(c.w, c.d).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
                {` · ${c.count} reviews`}
              </title>
            </motion.rect>
          ))}
          {MONTHS.map((m, i) => (
            <text
              key={m}
              x={(i / MONTHS.length) * WIDTH}
              y={HEIGHT + 10}
              className="font-mono"
              fill="oklch(0.5 0 0)"
              fontSize="6"
            >
              {m}
            </text>
          ))}
        </svg>
        {hover && (
          <div className="pointer-events-none absolute right-0 top-0 rounded bg-card px-2 py-1 font-mono text-[10px] text-foreground shadow">
            {dateForCell(hover.w, hover.d).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}{' '}
            · {hover.count} reviews
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-muted">
        less
        {LEVEL_COLORS.map((c, i) => (
          <span
            key={c}
            style={{ background: c }}
            aria-label={`level ${i}`}
            className="inline-block h-2.5 w-2.5 rounded-sm"
          />
        ))}
        more
      </div>
    </div>
  );
}
