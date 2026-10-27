import { create } from 'zustand';

export type StripeState =
  | 'authorized'
  | 'reauthorizing'
  | 'revising'
  | 'multicapture'
  | 'captured'
  | 'canceled';

export interface StripeNode {
  id: StripeState;
  x: number;
  y: number;
  label: string;
  /** Where the label sits so it never overlaps an edge. */
  labelPos: 'above' | 'below' | 'right';
}

export const STRIPE_NODES: StripeNode[] = [
  { id: 'canceled', x: 60, y: 28, label: 'canceled', labelPos: 'above' },
  { id: 'authorized', x: 60, y: 95, label: 'authorized', labelPos: 'below' },
  { id: 'reauthorizing', x: 180, y: 40, label: 'reauthorizing', labelPos: 'above' },
  { id: 'revising', x: 180, y: 148, label: 'revising', labelPos: 'right' },
  { id: 'multicapture', x: 290, y: 95, label: 'multicapture', labelPos: 'below' },
  { id: 'captured', x: 365, y: 95, label: 'captured', labelPos: 'below' },
];

export const STRIPE_NODE_BY_ID = Object.fromEntries(STRIPE_NODES.map((n) => [n.id, n])) as Record<
  StripeState,
  StripeNode
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

/** The scripted happy path walked by ▶ play (multicapture twice = two partial captures). */
export const STRIPE_SCRIPT: StripeState[] = [
  'authorized',
  'reauthorizing',
  'authorized',
  'multicapture',
  'multicapture',
  'captured',
];

/** The 4-day Stripe reauthorization window, compressed for the demo. */
export const REAUTH_TIMER_MS = 4000;
export const STEP_MS = 1100;

export function isLegalTransition(from: StripeState, to: StripeState) {
  return LEGAL.has(`${from}->${to}`);
}

/** How long the scripted walk dwells in a state before advancing. */
export function dwellMs(state: StripeState): number {
  return state === 'reauthorizing' ? REAUTH_TIMER_MS : STEP_MS;
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
  advance: () => void;
  clearIllegal: () => void;
  setReauthMs: (ms: number) => void;
}

const INITIAL: StoreState = {
  current: STRIPE_SCRIPT[0]!,
  reauthMs: REAUTH_TIMER_MS,
  step: 0,
  playing: false,
  illegal: null,
};

export const createTemporalStripeStore = () =>
  create<StoreState & StoreActions>((set, get) => ({
    ...INITIAL,
    play: () =>
      set((s) => {
        // Resume only when we're still on the scripted path and not at its end;
        // after a manual jump (e.g. to `canceled`) the walk starts over, so the
        // script never performs a transition the state machine forbids.
        const onScript = STRIPE_SCRIPT[s.step] === s.current;
        const finished = s.step >= STRIPE_SCRIPT.length - 1;
        return onScript && !finished ? { playing: true } : { ...INITIAL, playing: true };
      }),
    pause: () => set({ playing: false }),
    reset: () => set(INITIAL),
    jumpTo: (id) => {
      const { current } = get();
      if (id === current) return false;
      if (!isLegalTransition(current, id)) {
        set({ illegal: id });
        return false;
      }
      set({ current: id, playing: false, illegal: null });
      return true;
    },
    advance: () =>
      set((s) => {
        const next = STRIPE_SCRIPT[s.step + 1];
        if (!next) return { playing: false };
        const done = s.step + 1 >= STRIPE_SCRIPT.length - 1;
        return { current: next, step: s.step + 1, illegal: null, playing: !done };
      }),
    clearIllegal: () => set({ illegal: null }),
    setReauthMs: (ms) => set({ reauthMs: ms }),
  }));

export const useTemporalStripeStore = createTemporalStripeStore();
