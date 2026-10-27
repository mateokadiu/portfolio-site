import { mulberry32 } from './seededRandom';

// Deterministic year of study reviews for the studybuddy demo: 53 week
// columns × 7 weekday rows (Sun..Sat), starting on a Sunday.

export const WEEKS = 53;
export const DAYS = 7;
export const HEATMAP_START_UTC = Date.UTC(2025, 5, 1); // Sun, Jun 1 2025

const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Study load by calendar month: exam season peaks in May, summer is quiet.
const MONTH_LOAD = [0.7, 0.8, 0.9, 0.95, 1, 0.5, 0.2, 0.25, 0.6, 0.8, 0.85, 0.55];

export interface HeatCell {
  week: number;
  day: number;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function cellDate(week: number, day: number): Date {
  return new Date(HEATMAP_START_UTC + (week * DAYS + day) * DAY_MS);
}

export function levelFor(count: number): HeatCell['level'] {
  if (count > 44) return 4;
  if (count > 28) return 3;
  if (count > 14) return 2;
  if (count > 4) return 1;
  return 0;
}

/** Cells in column-major order: index = week * 7 + day. */
export function buildHeatmap(seed: number): HeatCell[] {
  const rand = mulberry32(seed);
  const cells: HeatCell[] = [];
  for (let week = 0; week < WEEKS; week++) {
    for (let day = 0; day < DAYS; day++) {
      const date = cellDate(week, day);
      const weekend = day === 0 || day === 6 ? 0.55 : 1;
      const count = Math.round(MONTH_LOAD[date.getUTCMonth()]! * weekend * rand() * 60);
      cells.push({
        week,
        day,
        date: date.toISOString().slice(0, 10),
        count,
        level: levelFor(count),
      });
    }
  }
  return cells;
}

/** One label per month, placed on the first week column that starts in it. */
export function monthLabels(): Array<{ week: number; label: string }> {
  const labels: Array<{ week: number; label: string }> = [];
  let previous = -1;
  for (let week = 0; week < WEEKS; week++) {
    const month = cellDate(week, 0).getUTCMonth();
    if (month !== previous) labels.push({ week, label: MONTHS[month]! });
    previous = month;
  }
  // A month that starts in the very last column has no room for its label.
  return labels.filter((l) => l.week < WEEKS - 2);
}

export function formatCellDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function summarize(cells: HeatCell[]) {
  const total = cells.reduce((sum, c) => sum + c.count, 0);
  const busiest = cells.reduce((best, c) => (c.count > best.count ? c : best), cells[0]!);
  return { total, busiest };
}
