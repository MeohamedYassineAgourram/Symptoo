import { describe, expect, it } from 'vitest';
import { buildSession, countIntroducedOn } from './session';
import type { SrsState } from './engine';
import { seededRng } from '../../utils/random';

const TODAY = '2026-10-10';
const MIX = { due: 60, new: 30, review: 10 };

function state(itemId: string, dueDate: string, interval: number, introducedOn = '2026-09-01'): SrsState {
  return { itemId, repetitions: 2, interval, easeFactor: 2.5, dueDate, introducedOn, lastReviewed: '2026-09-01', history: [] };
}

describe('buildSession', () => {
  const ids = Array.from({ length: 40 }, (_, i) => `c${i}`);
  const states = new Map<string, SrsState>();
  // c0..c9 due (c9 oldest), c10..c14 mastered and not due, c15..c19 learning not due, rest new.
  for (let i = 0; i < 10; i++) states.set(`c${i}`, state(`c${i}`, `2026-10-${String(10 - i).padStart(2, '0')}`, 3));
  for (let i = 10; i < 15; i++) states.set(`c${i}`, state(`c${i}`, '2026-12-01', 30));
  for (let i = 15; i < 20; i++) states.set(`c${i}`, state(`c${i}`, `2026-10-${11 + (19 - i)}`, 3));

  it('composes ~60/30/10 when every pool is large enough', () => {
    const slots = buildSession({ itemIds: ids, states, today: TODAY, size: 10, newRemaining: 15, mix: MIX, rng: seededRng(1) });
    const count = (k: string) => slots.filter((s) => s.kind === k).length;
    expect(slots).toHaveLength(10);
    expect(count('due')).toBe(6);
    expect(count('new')).toBe(3);
    expect(count('review')).toBe(1);
  });

  it('takes due items oldest first and new items in curriculum order', () => {
    const slots = buildSession({ itemIds: ids, states, today: TODAY, size: 10, newRemaining: 15, mix: MIX, rng: seededRng(1) });
    expect(slots.filter((s) => s.kind === 'due').map((s) => s.itemId)).toEqual(['c9', 'c8', 'c7', 'c6', 'c5', 'c4']);
    expect(slots.filter((s) => s.kind === 'new').map((s) => s.itemId)).toEqual(['c20', 'c21', 'c22']);
  });

  it('respects the daily new-item limit', () => {
    const slots = buildSession({ itemIds: ids, states, today: TODAY, size: 40, newRemaining: 2, mix: MIX, rng: seededRng(1) });
    expect(slots.filter((s) => s.kind === 'new')).toHaveLength(2);
  });

  it('back-fills from other pools and upcoming items, never duplicating', () => {
    const slots = buildSession({ itemIds: ids, states, today: TODAY, size: 40, newRemaining: 0, mix: MIX, rng: seededRng(1) });
    const idsPicked = slots.map((s) => s.itemId);
    expect(new Set(idsPicked).size).toBe(idsPicked.length);
    // 10 due + 5 mastered + 5 upcoming; new items excluded by limit.
    expect(slots).toHaveLength(20);
    expect(slots.filter((s) => s.kind === 'extra').map((s) => s.itemId)[0]).toBe('c19');
  });

  it('returns only new items for a brand-new player', () => {
    const slots = buildSession({ itemIds: ids, states: new Map(), today: TODAY, size: 10, newRemaining: 15, mix: MIX, rng: seededRng(1) });
    expect(slots.every((s) => s.kind === 'new')).toBe(true);
    expect(slots).toHaveLength(10);
  });
});

describe('countIntroducedOn', () => {
  it('counts items first seen on the given day', () => {
    const s = [state('a', TODAY, 1, TODAY), state('b', TODAY, 1, '2026-10-09'), state('c', TODAY, 1, TODAY)];
    expect(countIntroducedOn(s, TODAY)).toBe(2);
  });
});
