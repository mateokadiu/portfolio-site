import { describe, expect, it } from 'vitest';
import { buildHeatmap, cellDate, DAYS, levelFor, monthLabels, summarize, WEEKS } from '../heatmap';

describe('heatmap fixture', () => {
  const cells = buildHeatmap(42);

  it('is deterministic for a seed', () => {
    expect(buildHeatmap(42)).toEqual(cells);
    expect(buildHeatmap(7)).not.toEqual(cells);
  });

  it('has one cell per day, starting on a Sunday', () => {
    expect(cells).toHaveLength(WEEKS * DAYS);
    expect(cellDate(0, 0).getUTCDay()).toBe(0);
    expect(cells[0]!.date).toBe('2025-06-01');
    expect(cells[DAYS]!.date).toBe('2025-06-08');
  });

  it('labels each month at the first week that starts in it', () => {
    const labels = monthLabels();
    expect(labels[0]).toEqual({ week: 0, label: 'Jun' });
    for (const { week, label } of labels) {
      const month = cellDate(week, 0).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
      expect(month).toBe(label);
    }
  });

  it('maps counts to levels and summarizes', () => {
    expect([0, 5, 15, 29, 45].map(levelFor)).toEqual([0, 1, 2, 3, 4]);
    const { total, busiest } = summarize(cells);
    expect(total).toBe(cells.reduce((sum, c) => sum + c.count, 0));
    expect(cells.every((c) => c.count <= busiest.count)).toBe(true);
  });
});
