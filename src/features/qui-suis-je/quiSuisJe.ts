import type { Card } from '../../content/schemas';
import progression from '../../config/progression.json';
import { normalizeText } from '../../utils/normalize';
import { shuffle, type Rng } from '../../utils/random';
import type { Quality } from '../srs/engine';

/**
 * « Qui suis-je ? » (README §5.2): a sign or syndrome is revealed clue by clue; the fewer
 * clues used, the more points. Pure logic, unit-tested.
 */
export interface QsjRound {
  itemId: string;
  clues: string[];
  options: string[];
  correctIndex: number;
  isDraft: boolean;
}

const POINTS = progression.rewards.quiSuisJe.pointsByClues;
const OPTIONS = 4;

/** Cards that can be played: a name to guess and enough material for clues. */
export const isPlayable = (c: Card) => !!c.term && c.modes.includes('qui-suis-je') && (!!c.clues || !!c.explanation);

const familyOf = (c: Card) => (c.clues ? 'syndrome' : 'signe');

/** Default clue order (README): description → where/which system → what it indicates. */
export function cluesFor(c: Card, systemLabel: string): string[] {
  if (c.clues) return c.clues;
  return [c.explanation!, systemLabel, c.back];
}

export function buildRound(card: Card, pool: readonly Card[], systemLabel: string, rng: Rng): QsjRound {
  const name = card.term!;
  const used = new Set([normalizeText(name)]);
  const same = pool.filter((c) => c.id !== card.id && isPlayable(c) && familyOf(c) === familyOf(card));
  const other = pool.filter((c) => c.id !== card.id && isPlayable(c) && familyOf(c) !== familyOf(card));
  const distractors: string[] = [];
  for (const c of [...shuffle(same, rng), ...shuffle(other, rng)]) {
    if (distractors.length >= OPTIONS - 1) break;
    const key = normalizeText(c.term!);
    if (used.has(key)) continue;
    used.add(key);
    distractors.push(c.term!);
  }
  const options = shuffle([name, ...distractors], rng);
  return { itemId: card.id, clues: cluesFor(card, systemLabel), options, correctIndex: options.indexOf(name), isDraft: card.status === 'draft' };
}

export interface RoundOutcome {
  points: number;
  quality: Quality;
  found: boolean;
}

/**
 * Grading by the number of clues shown when the answer was given:
 * 1 clue = 100 pts / quality 5, 2 = 60 / 4, 3+ = 30 / 3; wrong = 0 / 1; « Je ne sais pas » = 0 / 0.
 */
export function gradeRound(cluesShown: number, correct: boolean | null): RoundOutcome {
  if (correct === null) return { points: 0, quality: 0, found: false };
  if (!correct) return { points: 0, quality: 1, found: false };
  const i = Math.min(Math.max(cluesShown, 1), POINTS.length) - 1;
  return { points: POINTS[i]!, quality: ([5, 4, 3] as const)[i]!, found: true };
}
