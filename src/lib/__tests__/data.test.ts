import { describe, expect, it } from 'vitest';
import { sitePath, siteUrl } from '../data';
import { formatRelative, formatShortDate } from '../time';

describe('canonical URLs', () => {
  it('always uses a trailing slash', () => {
    expect(sitePath('/about')).toBe('/about/');
    expect(sitePath('about/')).toBe('/about/');
    expect(sitePath('/')).toBe('/');
    expect(siteUrl('/projects/tide')).toBe('https://mateokadiu.com/projects/tide/');
    expect(siteUrl()).toBe('https://mateokadiu.com/');
  });

  it('leaves hash links alone', () => {
    expect(sitePath('/#work')).toBe('/#work');
  });
});

describe('time labels', () => {
  const now = Date.parse('2026-10-27T12:00:00Z');

  it('formats relative time', () => {
    expect(formatRelative('2026-10-27T11:59:30Z', now)).toBe('just now');
    expect(formatRelative('2026-10-27T09:00:00Z', now)).toBe('3h ago');
    expect(formatRelative('2026-10-20T12:00:00Z', now)).toBe('7d ago');
    expect(formatRelative('2026-06-30T12:00:00Z', now)).toBe('3mo ago');
    expect(formatRelative('2024-10-27T12:00:00Z', now)).toBe('2y ago');
  });

  it('formats an absolute fallback date in UTC', () => {
    expect(formatShortDate('2026-06-30T23:30:00Z')).toBe('jun 30, 2026');
  });
});
