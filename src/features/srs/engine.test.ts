import { describe, expect, it } from 'vitest';
import { isDue, isMastered, review, requeueOffset, type Quality, type SrsState } from './engine';
import { seededRng } from '../../utils/random';

const DAY = '2026-10-01';

function reviewMany(qualities: Quality[], start = DAY): SrsState {
  let state: SrsState | undefined;
  let day = start;
  for (const q of qualities) {
    state = review(state, 'x', q, day);
    day = state.dueDate;
  }
  return state!;
}

describe('review (SM-2)', () => {
  it('creates a state on first review with interval 1', () => {
    const s = review(undefined, 'card-1', 4, DAY);
    expect(s).toMatchObject({ itemId: 'card-1', repetitions: 1, interval: 1, dueDate: '2026-10-02' });
    expect(s.introducedOn).toBe(DAY);
    expect(s.history).toEqual([{ day: DAY, quality: 4 }]);
  });

  it('follows the 1 → 3 → round(interval × EF) progression', () => {
    const s1 = review(undefined, 'x', 5, DAY);
    const s2 = review(s1, 'x', 5, s1.dueDate);
    const s3 = review(s2, 'x', 5, s2.dueDate);
    expect([s1.interval, s2.interval, s3.interval]).toEqual([1, 3, Math.round(3 * s2.easeFactor)]);
    expect(s3.repetitions).toBe(3);
  });

  it('updates the ease factor with the SM-2 formula', () => {
    expect(review(undefined, 'x', 5, DAY).easeFactor).toBeCloseTo(2.6);
    expect(review(undefined, 'x', 4, DAY).easeFactor).toBeCloseTo(2.5);
    expect(review(undefined, 'x', 3, DAY).easeFactor).toBeCloseTo(2.36);
    expect(review(undefined, 'x', 0, DAY).easeFactor).toBeCloseTo(1.7);
  });

  it('never lets the ease factor drop below 1.3', () => {
    expect(reviewMany([0, 0, 0, 0, 0, 0]).easeFactor).toBe(1.3);
  });

  it('resets repetitions and interval on a failed review (quality < 3)', () => {
    const learned = reviewMany([5, 5, 5, 5]);
    expect(learned.interval).toBeGreaterThan(3);
    const failed = review(learned, 'x', 2, learned.dueDate);
    expect(failed.repetitions).toBe(0);
    expect(failed.interval).toBe(1);
    expect(failed.introducedOn).toBe(learned.introducedOn);
  });

  it('marks an item mastered once interval >= 21 days', () => {
    const s = reviewMany([5, 5, 5, 5]);
    // Interval uses the ease factor before this review: 1, 3, round(3×2.7)=8, round(8×2.8)=22
    expect(s.interval).toBe(22);
    expect(isMastered(s)).toBe(true);
    expect(isMastered(reviewMany([5, 5, 5]))).toBe(false);
    expect(isMastered(undefined)).toBe(false);
  });

  it('knows when an item is due', () => {
    const s = review(undefined, 'x', 4, DAY);
    expect(isDue(s, DAY)).toBe(false);
    expect(isDue(s, '2026-10-02')).toBe(true);
    expect(isDue(undefined, DAY)).toBe(false);
  });

  it('computes due dates across month boundaries', () => {
    const s = review(undefined, 'x', 4, '2026-10-31');
    expect(s.dueDate).toBe('2026-11-01');
  });
});

describe('requeueOffset', () => {
  it('always returns 3, 4 or 5', () => {
    const rng = seededRng(42);
    const values = new Set(Array.from({ length: 200 }, () => requeueOffset(rng)));
    expect([...values].sort()).toEqual([3, 4, 5]);
  });
});
