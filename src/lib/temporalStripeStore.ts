import { create } from 'zustand';

export type StripeState =
  | 'authorized'
  | 'reauthorizing'
  | 'revising'
  | 'multicapture'
  | 'captured'
  | 'canceled';

export const STRIPE_NODES: Array<{ id: StripeState; x: number; y: number; label: string }> = [
  { id: 'authorized', x: 60, y: 40, label: 'authorized' },
  { id: 'reauthorizing', x: 200, y: 40, label: 'reauthorizing' },
  { id: 'revising', x: 60, y: 110, label: 'revising' },
  { id: 'multicapture', x: 200, y: 110, label: 'multicapture' },
  { id: 'captured', x: 330, y: 110, label: 'captured' },
  { id: 'canceled', x: 330, y: 40, label: 'canceled' },
];

export const STRIPE_NODE_BY_ID = Object.fromEntries(STRIPE_NODES.map((n) => [n.id, n])) as Record<
  StripeState,
  (typeof STRIPE_NODES)[number]
>;

export const STRIPE_EDGES: Array<{ from: StripeState; to: StripeState }> = [
  { from: 'authorized', to: 'reauthorizing' },
  { from: 'reauthorizing', to: 'authorized' },
  { from: 'authorized', to: 'revising' },
  { from: 'revising', to: 'multicapture' },
  { from: 'authorized', to: 'multicapture' },
  { from: 'multicapture', to: 'captured' },
  { from: 'authorized', to: 'canceled' },
];

const LEGAL = new Set(STRIPE_EDGES.map((e) => `${e.from}->${e.to}`));
export const STRIPE_TERMINAL: Set<StripeState> = new Set(['captured', 'canceled']);
export const STRIPE_SCRIPT: StripeState[] = [
  'authorized',
  'reauthorizing',
  'authorized',
  'multicapture',
  'multicapture',
  'captured',
];

export const REAUTH_TIMER_MS = 4000;

export function isLegalTransition(from: StripeState, to: StripeState) {
  return LEGAL.has(`${from}->${to}`);
}

interface StoreState {
  current: StripeState;
  reauthMs: number;
  step: number;
  playing: boolean;
  illegal: StripeState | null;
}

interface StoreActions {
  play: () => void;
  pause: () => void;
  reset: () => void;
  jumpTo: (id: StripeState) => boolean;
  advance: (next: StripeState) => void;
  flashIllegal: (id: StripeState) => void;
  clearIllegal: () => void;
  setReauthMs: (ms: number) => void;
}

export const useTemporalStripeStore = create<StoreState & StoreActions>((set, get) => ({
  current: 'authorized',
  reauthMs: REAUTH_TIMER_MS,
  step: 0,
  playing: false,
  illegal: null,
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  reset: () =>
    set({
      current: 'authorized',
      step: 0,
      playing: false,
      reauthMs: REAUTH_TIMER_MS,
      illegal: null,
    }),
  jumpTo: (id) => {
    const { current } = get();
    if (id === current) return false;
    if (!isLegalTransition(current, id)) {
      set({ illegal: id });
      return false;
    }
    set({ current: id, playing: false });
    return true;
  },
  advance: (next) => set((s) => ({ current: next, step: s.step + 1 })),
  flashIllegal: (id) => set({ illegal: id }),
  clearIllegal: () => set({ illegal: null }),
  setReauthMs: (ms) => set({ reauthMs: ms }),
}));
