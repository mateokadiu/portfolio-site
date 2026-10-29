// Pure logic for the wattslot tile: parse the public price API, classify
// quarter hours as cheap / normal / expensive and find the cheapest run.
// Mirrors apps/web/src/lib/insights.ts in the wattslot repo.

export const WATTSLOT_API = 'https://wattslot.mateokadiu.com';
export const TIME_ZONE = 'Europe/Copenhagen';
const SLOT_MS = 15 * 60_000;

/** Radius Elnet: the grid company for most of Copenhagen (price area DK2). */
const ZONE = 'DK2';
const GLN = '5790000705689';

export type Level = 'cheap' | 'normal' | 'expensive';

export interface PriceDay {
  zone: string;
  company: string | null;
  /** `spot-only` when grid tariffs couldn't be added. */
  mode: 'full' | 'spot-only';
  /** Start of each quarter hour, epoch ms, ascending. */
  starts: number[];
  /** All-in price per kWh incl. VAT, DKK. */
  totals: number[];
}

/** Wednesday 28 October 2026, as published: shown until (or unless) live prices load. */
export const SAMPLE: PriceDay = {
  zone: ZONE,
  company: 'Radius Elnet A/S',
  mode: 'full',
  starts: Array.from({ length: 96 }, (_, i) => Date.UTC(2026, 9, 27, 23) + i * SLOT_MS),
  totals: [
    1.6578, 1.6703, 1.6923, 1.7025, 1.717, 1.7182, 1.7239, 1.7564, 1.7338, 1.7563, 1.8024, 1.8098,
    1.8021, 1.8085, 1.8175, 1.858, 1.8589, 1.9009, 1.8973, 1.9021, 1.806, 1.8587, 1.9264, 1.9805,
    2.4846, 2.5654, 2.6525, 2.8953, 3.0533, 3.0983, 3.0262, 3.1031, 3.2038, 3.2162, 3.1101, 2.8745,
    2.9495, 2.7964, 2.6464, 2.5569, 2.6865, 2.6226, 2.4802, 2.3846, 2.5379, 2.5364, 2.4252, 2.3722,
    2.4114, 2.3781, 2.3645, 2.3484, 2.3546, 2.3407, 2.3336, 2.2933, 2.2828, 2.3482, 2.4345, 2.4908,
    2.3517, 2.4854, 2.7797, 3.1115, 2.75, 3.0711, 3.3468, 3.4565, 4.0373, 4.1075, 4.1372, 4.1462,
    4.3457, 4.3191, 4.1106, 4.0575, 4.1106, 4.1154, 3.9696, 3.8821, 4.1347, 4.1365, 4.0834, 3.7492,
    3.26, 3.037, 2.827, 2.6602, 2.8538, 2.7605, 2.6551, 2.5832, 2.6268, 2.5616, 2.6158, 2.5587,
  ],
};

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const dayFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** YYYY-MM-DD in Copenhagen. */
export const copenhagenDate = (ms: number): string => dateFormat.format(ms);
/** HH:mm in Copenhagen. */
export const clock = (ms: number): string => clockFormat.format(ms);
/** "Wed 28 Oct". */
export const dayLabel = (ms: number): string => dayFormat.format(ms).replace(',', '');

/** Today's prices for Copenhagen, from the public API. */
export const pricesUrl = (nowMs: number): string =>
  `${WATTSLOT_API}/v1/prices?zone=${ZONE}&gln=${GLN}&date=${copenhagenDate(nowMs)}&days=1`;

/** Validates an API response; anything unexpected returns null and the tile keeps the sample. */
export function parsePrices(json: unknown): PriceDay | null {
  if (typeof json !== 'object' || json === null) return null;
  const body = json as Record<string, unknown>;
  if (!Array.isArray(body.slots) || body.slots.length < 8) return null;
  const starts: number[] = [];
  const totals: number[] = [];
  for (const slot of body.slots as unknown[]) {
    const s = slot as Record<string, unknown> | null;
    const start = typeof s?.start === 'string' ? Date.parse(s.start) : Number.NaN;
    if (!Number.isFinite(start) || typeof s?.total !== 'number' || !Number.isFinite(s.total)) {
      return null;
    }
    starts.push(start);
    totals.push(s.total);
  }
  const company = body.gridCompany as { name?: unknown } | null | undefined;
  return {
    zone: typeof body.zone === 'string' ? body.zone : ZONE,
    company: typeof company?.name === 'string' ? company.name : null,
    mode: body.mode === 'spot-only' ? 'spot-only' : 'full',
    starts,
    totals,
  };
}

/** Value at quantile q (0–1) of a sorted list, interpolated. */
function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return (sorted[lo] as number) + ((sorted[hi] as number) - (sorted[lo] as number)) * (pos - lo);
}

/** Cheap, normal or expensive by thirds of the day. A flat day is all normal. */
export function levels(totals: readonly number[]): Level[] {
  const sorted = [...totals].sort((a, b) => a - b);
  const low = quantile(sorted, 1 / 3);
  const high = quantile(sorted, 2 / 3);
  const flat = (sorted.at(-1) ?? 0) - (sorted[0] ?? 0) < 1e-9;
  return totals.map((t) =>
    flat ? 'normal' : t <= low ? 'cheap' : t >= high ? 'expensive' : 'normal',
  );
}

export interface Window {
  /** Index of the first quarter hour. */
  from: number;
  /** Number of quarter hours. */
  length: number;
  average: number;
}

/**
 * The cheapest run of `length` back-to-back quarter hours (a sliding sum).
 * Never spans a gap in the data; ties go to the earliest.
 */
export function cheapestWindow(day: PriceDay, length: number): Window | null {
  let best: Window | null = null;
  let sum = 0;
  let run = 0;
  for (let i = 0; i < day.totals.length; i++) {
    const contiguous =
      i > 0 && (day.starts[i] as number) - (day.starts[i - 1] as number) === SLOT_MS;
    if (!contiguous) {
      sum = 0;
      run = 0;
    }
    sum += day.totals[i] as number;
    run++;
    if (run > length) {
      sum -= day.totals[i - length] as number;
      run = length;
    }
    if (run === length && (best === null || sum / length < best.average - 1e-12)) {
      best = { from: i - length + 1, length, average: sum / length };
    }
  }
  return best;
}

/** Index of the quarter hour containing `nowMs`, or -1 if it isn't in the day. */
export function slotAt(day: PriceDay, nowMs: number): number {
  return day.starts.findIndex((start) => nowMs >= start && nowMs < start + SLOT_MS);
}

export const slotEnd = (start: number): number => start + SLOT_MS;
