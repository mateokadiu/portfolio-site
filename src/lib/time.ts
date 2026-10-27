/** Compact "time ago" label (e.g. "3d ago"). Client-safe; used to keep build-time dates fresh. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const sec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}d ago`;
  if (sec < 86400 * 365) return `${Math.floor(sec / (86400 * 30))}mo ago`;
  return `${Math.floor(sec / (86400 * 365))}y ago`;
}

/** Absolute short date ("jun 30, 2026") — the no-JS fallback for relative labels. */
export function formatShortDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toLowerCase();
}
