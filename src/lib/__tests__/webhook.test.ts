import { describe, expect, it } from 'vitest';
import {
  BACKOFF_SECONDS,
  DLQ_STEP,
  RETRY_COUNT,
  attemptsAt,
  backoffLabel,
  statusMessage,
} from '../webhook';

describe('backoffLabel', () => {
  it('formats each unit', () => {
    expect(BACKOFF_SECONDS.map(backoffLabel)).toEqual(['+30s', '+2m', '+10m', '+1h', '+6h', '+1d']);
    expect(backoffLabel(0)).toBe('fired');
  });
});

describe('attemptsAt', () => {
  it('shows nothing before the first delivery', () => {
    expect(attemptsAt(0, true)).toEqual([]);
  });

  it('delivers on the first try when the downstream is healthy', () => {
    expect(attemptsAt(1, false)).toEqual([{ label: 'fired', status: 'ok' }]);
  });

  it('adds one retry per step and fails only the last one', () => {
    expect(attemptsAt(3, true).map((a) => a.label)).toEqual(['fired', '+30s', '+2m']);
    const dlq = attemptsAt(DLQ_STEP, true);
    expect(dlq).toHaveLength(RETRY_COUNT + 1);
    expect(dlq.at(-1)).toEqual({ label: '+1d', status: 'failed' });
    expect(dlq.slice(0, -1).every((a) => a.status === 'retrying')).toBe(true);
  });

  it('never exceeds the retry budget', () => {
    expect(attemptsAt(DLQ_STEP + 5, true)).toHaveLength(RETRY_COUNT + 1);
  });
});

describe('statusMessage', () => {
  it('matches the schedule', () => {
    expect(statusMessage(0, true)).toBe('no attempts yet');
    expect(statusMessage(1, true)).toBe('1st attempt failed — backing off 30s');
    expect(statusMessage(2, true)).toBe('retry 1 failed — backing off 2m');
    expect(statusMessage(DLQ_STEP, true)).toBe(
      `parked in DLQ after ${RETRY_COUNT} retries — needs manual replay`,
    );
    expect(statusMessage(1, false)).toBe('delivered on the first try');
  });
});
