import { describe, expect, it } from 'vitest';
import type { SrsState } from '../srs/engine';
import { accuracyOf, dueByDay, formatDuration } from './stats';

const st = (itemId: string, dueDate: string, qualities: number[] = []) =>
  ({ itemId, dueDate, history: qualities.map((quality) => ({ day: '2026-10-01', quality })) }) as unknown as SrsState;

describe('agenda and statistics', () => {
  it('counts follow-ups per day, folding overdue ones into today', () => {
    const d = dueByDay([st('a', '2026-10-01'), st('b', '2026-10-05'), st('c', '2026-10-07'), st('d', '2026-10-30')], '2026-10-05', 3);
    expect(d).toEqual([
      { day: '2026-10-05', count: 2 },
      { day: '2026-10-06', count: 0 },
      { day: '2026-10-07', count: 1 },
    ]);
  });

  it('computes accuracy from SM-2 history', () => {
    const states = new Map([['a', st('a', 'x', [5, 1, 4])], ['b', st('b', 'x', [3])]]);
    expect(accuracyOf(['a', 'b', 'z'], states)).toEqual({ accuracy: 0.75, reviews: 4 });
    expect(accuracyOf(['z'], states)).toEqual({ accuracy: null, reviews: 0 });
  });

  it('formats study time', () => {
    expect(formatDuration(125 * 60)).toBe('2 h 05');
    expect(formatDuration(600)).toBe('10 min');
  });
});
