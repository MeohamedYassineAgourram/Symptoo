import { addDays, type DayString } from '../../utils/dates';

/** SM-2 quality grade, 0 (skipped) to 5 (perfect). See README §7.1. */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewLogEntry {
  day: DayString;
  quality: Quality;
}

export interface SrsState {
  itemId: string;
  repetitions: number;
  /** Days until the next review. */
  interval: number;
  easeFactor: number;
  dueDate: DayString;
  /** Day the item was first seen, used for the daily new-item limit. */
  introducedOn: DayString;
  lastReviewed: DayString;
  history: ReviewLogEntry[];
}

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MASTERED_INTERVAL = 21;

/** Applies one review (README §7.2). Pure: returns a new state. */
export function review(state: SrsState | undefined, itemId: string, quality: Quality, today: DayString): SrsState {
  const prev = state ?? {
    itemId,
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE,
    dueDate: today,
    introducedOn: today,
    lastReviewed: today,
    history: [],
  };

  let { repetitions, interval } = prev;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * prev.easeFactor);
    repetitions += 1;
  }

  const q = 5 - quality;
  const easeFactor = Math.max(MIN_EASE, prev.easeFactor + 0.1 - q * (0.08 + q * 0.02));

  return {
    ...prev,
    repetitions,
    interval,
    easeFactor,
    dueDate: addDays(today, interval),
    lastReviewed: today,
    history: [...prev.history, { day: today, quality }],
  };
}

export function isMastered(state: SrsState | undefined): boolean {
  return !!state && state.interval >= MASTERED_INTERVAL;
}

export function isDue(state: SrsState | undefined, today: DayString): boolean {
  return !!state && state.dueDate <= today;
}

/** Wrong answers come back in the same garde after 3–5 other items. */
export function requeueOffset(rng: () => number): number {
  return 3 + Math.floor(rng() * 3);
}
