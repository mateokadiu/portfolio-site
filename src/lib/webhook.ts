// Retry model behind the webhook-gateway demo.

export interface Attempt {
  label: string;
  status: 'ok' | 'retrying' | 'failed';
}

/** Default backoff schedule from the webhook-gateway repo, in seconds. */
export const BACKOFF_SECONDS = [30, 120, 600, 3600, 21600, 86400];

export const RETRY_COUNT = BACKOFF_SECONDS.length;

/** Steps until the event lands in the DLQ: the first attempt plus every retry. */
export const DLQ_STEP = RETRY_COUNT + 1;

export function backoffLabel(sec: number): string {
  if (sec === 0) return 'fired';
  if (sec < 60) return `+${sec}s`;
  if (sec < 3600) return `+${sec / 60}m`;
  if (sec < 86400) return `+${sec / 3600}h`;
  return `+${sec / 86400}d`;
}

/** Delivery attempts visible after `step` clicks. */
export function attemptsAt(step: number, downstreamDown: boolean): Attempt[] {
  if (step <= 0) return [];
  if (!downstreamDown) return [{ label: 'fired', status: 'ok' }];

  const attempts: Attempt[] = [{ label: 'fired', status: 'retrying' }];
  const retries = Math.min(step - 1, RETRY_COUNT);
  for (let i = 0; i < retries; i += 1) {
    const exhausted = i === RETRY_COUNT - 1;
    attempts.push({
      label: backoffLabel(BACKOFF_SECONDS[i]!),
      status: exhausted ? 'failed' : 'retrying',
    });
  }
  return attempts;
}

/** Status line under the timeline. */
export function statusMessage(step: number, downstreamDown: boolean): string {
  if (step <= 0) return 'no attempts yet';
  if (!downstreamDown) return 'delivered on the first try';
  if (step >= DLQ_STEP) return `parked in DLQ after ${RETRY_COUNT} retries — needs manual replay`;
  const wait = backoffLabel(BACKOFF_SECONDS[step - 1]!).replace('+', '');
  return step === 1
    ? `1st attempt failed — backing off ${wait}`
    : `retry ${step - 1} failed — backing off ${wait}`;
}
