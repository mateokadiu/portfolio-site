import { beforeEach, describe, expect, it } from 'vitest';
import {
  REAUTH_TIMER_MS,
  STEP_MS,
  STRIPE_SCRIPT,
  createTemporalStripeStore,
  dwellMs,
  isLegalTransition,
} from '../temporalStripeStore';

let store: ReturnType<typeof createTemporalStripeStore>;
beforeEach(() => {
  store = createTemporalStripeStore();
});

const walk = () => {
  const visited = [store.getState().current];
  while (store.getState().playing) {
    store.getState().advance();
    visited.push(store.getState().current);
  }
  return visited;
};

describe('state machine', () => {
  it('only allows the documented transitions', () => {
    expect(isLegalTransition('authorized', 'reauthorizing')).toBe(true);
    expect(isLegalTransition('authorized', 'captured')).toBe(false);
    expect(isLegalTransition('canceled', 'reauthorizing')).toBe(false);
  });

  it('every step of the scripted walk is a legal transition (or a repeat)', () => {
    for (let i = 1; i < STRIPE_SCRIPT.length; i++) {
      const [from, to] = [STRIPE_SCRIPT[i - 1]!, STRIPE_SCRIPT[i]!];
      expect(from === to || isLegalTransition(from, to)).toBe(true);
    }
  });

  it('dwells for the full reauth timer only in reauthorizing', () => {
    expect(dwellMs('reauthorizing')).toBe(REAUTH_TIMER_MS);
    expect(dwellMs('authorized')).toBe(STEP_MS);
  });
});

describe('store', () => {
  it('plays the script to the end and stops', () => {
    store.getState().play();
    expect(walk()).toEqual(STRIPE_SCRIPT);
    expect(store.getState()).toMatchObject({ current: 'captured', playing: false });
  });

  it('flags an illegal jump without changing state', () => {
    expect(store.getState().jumpTo('captured')).toBe(false);
    expect(store.getState()).toMatchObject({ current: 'authorized', illegal: 'captured' });
  });

  it('restarts the script after a manual jump instead of walking from the wrong state', () => {
    expect(store.getState().jumpTo('canceled')).toBe(true);
    store.getState().play();
    expect(store.getState()).toMatchObject({ current: 'authorized', step: 0, playing: true });
    expect(walk()).toEqual(STRIPE_SCRIPT);
  });

  it('restarts when play is pressed after the walk finished', () => {
    store.getState().play();
    walk();
    store.getState().play();
    expect(store.getState()).toMatchObject({ current: 'authorized', step: 0, playing: true });
  });

  it('resumes in place after a pause', () => {
    store.getState().play();
    store.getState().advance();
    store.getState().pause();
    store.getState().play();
    expect(store.getState()).toMatchObject({ current: 'reauthorizing', step: 1, playing: true });
  });
});
