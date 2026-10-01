import type { Card } from '../../content/schemas';
import { normalizeText } from '../../utils/normalize';
import { shuffle, type Rng } from '../../utils/random';

export type QuestionDirection = 'forward' | 'reverse';

export interface SpeedQuestion {
  itemId: string;
  direction: QuestionDirection;
  /** Question text (forward) or the sign description to identify (reverse). */
  prompt: string;
  options: string[];
  correctIndex: number;
  isDraft: boolean;
}

const OPTION_COUNT = 4;
const REVERSE_CHANCE = 0.4;

const canReverse = (c: Card): c is Card & { term: string; explanation: string } => !!c.term && !!c.explanation;

/**
 * Builds a 4-choice question from a card. Distractors come from other cards' answers,
 * preferring the same tag and wing so they stay plausible. Cards with a `term` (eponymous
 * signs) are sometimes asked in reverse: description → name the sign.
 */
export function generateQuestion(card: Card, pool: readonly Card[], rng: Rng): SpeedQuestion {
  const others = pool.filter((c) => c.id !== card.id);
  const reversible = others.filter(canReverse);
  const reverse = canReverse(card) && reversible.length >= OPTION_COUNT - 1 && rng() < REVERSE_CHANCE;

  const answer = reverse ? card.term! : card.back;
  const answerOf = (c: Card) => (reverse ? c.term! : c.back);
  const candidates = reverse ? reversible : others;

  const sharesTag = (c: Card) => c.tags.some((t) => card.tags.includes(t));
  const tiers = [
    candidates.filter((c) => sharesTag(c) && c.wing === card.wing),
    candidates.filter((c) => sharesTag(c) && c.wing !== card.wing),
    candidates.filter((c) => !sharesTag(c) && c.wing === card.wing),
    candidates.filter((c) => !sharesTag(c) && c.wing !== card.wing),
  ];

  const used = new Set([normalizeText(answer)]);
  const distractors: string[] = [];
  for (const tier of tiers) {
    for (const c of shuffle(tier, rng)) {
      if (distractors.length >= OPTION_COUNT - 1) break;
      const text = answerOf(c);
      const key = normalizeText(text);
      if (used.has(key)) continue;
      used.add(key);
      distractors.push(text);
    }
  }

  const options = shuffle([answer, ...distractors], rng);
  return {
    itemId: card.id,
    direction: reverse ? 'reverse' : 'forward',
    prompt: reverse ? card.explanation! : card.front,
    options,
    correctIndex: options.indexOf(answer),
    isDraft: card.status === 'draft',
  };
}
