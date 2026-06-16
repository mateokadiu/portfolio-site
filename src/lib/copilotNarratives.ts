export interface TradeSample {
  pair: string;
  side: 'long' | 'short';
  lot: number;
  pnl: number;
  durationMin: number;
  window: string;
}

export const SAMPLE_TRADE: TradeSample = {
  pair: 'EUR/USD',
  side: 'long',
  lot: 0.5,
  pnl: 87.2,
  durationMin: 47,
  window: 'london open',
};

export const NARRATIVES: string[] = [
  "This trade fits your typical London open pattern — sized at your 30-day median lot, held 47 minutes, exited just below your 80th-percentile profit target. Your journal note today flagged 'confident, patient' which the outcome corroborates. No drift from plan.",
  "Plan said 'half size on EUR if DXY > 105.2'. DXY was 105.4 at entry, you took full size. The trade worked, but it broke your own filter — that's the second time this week. Worth a journal entry tonight on whether the rule still applies.",
  "Held longer than 70% of your winning longs this month. The exit was reactive, not at a level. Compare to last Tuesday's GBP/JPY trade — same shape, you exited at +0.62R there. Today was +1.1R but with more give-back than your style allows.",
  "Pattern match on your March '26 EUR longs — same window, similar size, slightly tighter stop. Win-rate on this exact pattern is 7/10 over your last 30 days. Plan compliance: green. Style drift: none. Keep this template.",
];
