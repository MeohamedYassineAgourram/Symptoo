import type { DayString } from '../../utils/dates';
import { shuffle, type Rng } from '../../utils/random';
import { isDue, isMastered, type SrsState } from './engine';

export type SessionSlotKind = 'due' | 'new' | 'review' | 'extra';

export interface SessionSlot {
  itemId: string;
  kind: SessionSlotKind;
}

export interface SessionMix {
  due: number;
  new: number;
  review: number;
}

export interface BuildSessionInput {
  /** Candidate item ids in curriculum order. */
  itemIds: readonly string[];
  states: ReadonlyMap<string, SrsState>;
  today: DayString;
  size: number;
  /** New items still allowed today (daily limit minus items already introduced today). */
  newRemaining: number;
  mix: SessionMix;
  rng: Rng;
}

/** Number of items introduced on `today`, for the daily new-item limit. */
export function countIntroducedOn(states: Iterable<SrsState>, today: DayString): number {
  let n = 0;
  for (const s of states) if (s.introducedOn === today) n++;
  return n;
}

/**
 * Composes a session (README §7.3): ~60% due follow-ups (oldest first), ~30% new items
 * (curriculum order, capped by the daily limit), ~10% random mastered reviews.
 * Short pools are back-filled from the others, then from not-yet-due items (soonest first)
 * so a session is never empty while content exists.
 */
export function buildSession(input: BuildSessionInput): SessionSlot[] {
  const { itemIds, states, today, size, mix, rng } = input;
  const newRemaining = Math.max(0, input.newRemaining);

  const due: SrsState[] = [];
  const fresh: string[] = [];
  const mastered: string[] = [];
  const upcoming: SrsState[] = [];

  for (const id of itemIds) {
    const s = states.get(id);
    if (!s) fresh.push(id);
    else if (isDue(s, today)) due.push(s);
    else if (isMastered(s)) mastered.push(id);
    else upcoming.push(s);
  }
  due.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
  upcoming.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));

  const pools: Record<Exclude<SessionSlotKind, 'extra'>, string[]> = {
    due: due.map((s) => s.itemId),
    new: fresh.slice(0, newRemaining),
    review: shuffle(mastered, rng),
  };

  const total = mix.due + mix.new + mix.review;
  const targets = {
    due: Math.round((size * mix.due) / total),
    new: Math.round((size * mix.new) / total),
    review: 0,
  };
  targets.review = Math.max(0, size - targets.due - targets.new);

  const picked: SessionSlot[] = [];
  const take = (kind: Exclude<SessionSlotKind, 'extra'>, n: number) => {
    const pool = pools[kind];
    while (n-- > 0 && pool.length && picked.length < size) picked.push({ itemId: pool.shift()!, kind });
  };

  take('due', targets.due);
  take('new', targets.new);
  take('review', targets.review);
  // Back-fill in priority order.
  take('due', size);
  take('new', size);
  take('review', size);
  for (const s of upcoming) {
    if (picked.length >= size) break;
    picked.push({ itemId: s.itemId, kind: 'extra' });
  }
  return picked;
}
