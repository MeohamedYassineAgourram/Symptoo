import type { ClinicalCase } from '../../content/schemas';
import type { WingId } from '../../content/wings';
import syndromeConfig from '../../config/syndromes.json';
import { matchesAnyAnswer, normalizeText } from '../../utils/normalize';
import { shuffle, type Rng } from '../../utils/random';

export interface SynthesisAnswer {
  syndromes: string[];
  /** Picked from the list, or typed (matched against accepted synonyms). */
  etiology: string | null;
  bonus: number[] | null;
  gaveUp?: boolean;
}

export interface SynthesisGrade {
  /** correct = exactly the expected syndromes; partial = at least one right; wrong = none right. */
  syndrome: 'correct' | 'partial' | 'wrong';
  /** n/a when the case asks for no étiologie. */
  etiology: 'correct' | 'wrong' | 'n/a';
  bonus: 'correct' | 'wrong' | 'n/a';
  missingSyndromes: string[];
  extraSyndromes: string[];
}

const same = (a: string, b: string) => normalizeText(a) === normalizeText(b);

export function gradeSynthesis(c: ClinicalCase, a: SynthesisAnswer): SynthesisGrade {
  const expected = c.answer.syndrome;
  const missingSyndromes = expected.filter((e) => !a.syndromes.some((s) => same(s, e)));
  const extraSyndromes = a.syndromes.filter((s) => !expected.some((e) => same(s, e)));
  const right = expected.length - missingSyndromes.length;
  const syndrome = a.gaveUp || right === 0 ? 'wrong' : missingSyndromes.length === 0 && extraSyndromes.length === 0 ? 'correct' : 'partial';

  let etiology: SynthesisGrade['etiology'] = 'n/a';
  if (c.answer.etiology) {
    const accepted = [c.answer.etiology, ...c.answer.acceptedSynonyms];
    etiology = !a.gaveUp && a.etiology && matchesAnyAnswer(a.etiology, accepted) ? 'correct' : 'wrong';
  }

  let bonus: SynthesisGrade['bonus'] = 'n/a';
  if (c.bonusQuestion) {
    const want = [...c.bonusQuestion.correct].sort().join(',');
    bonus = !a.gaveUp && a.bonus && [...a.bonus].sort().join(',') === want ? 'correct' : 'wrong';
  }
  return { syndrome, etiology, bonus, missingSyndromes, extraSyndromes };
}

/** Syndrome choices: the expected ones plus plausible distractors from the same wings. */
export function syndromeOptions(c: ClinicalCase, rng: Rng, total = 8): string[] {
  const expected = c.answer.syndrome;
  const pool = syndromeConfig.syndromes.filter((s) => !expected.some((e) => same(e, s.label)));
  const sameWing = shuffle(pool.filter((s) => s.wings.includes(c.wing as WingId)), rng);
  const others = shuffle(pool.filter((s) => !s.wings.includes(c.wing as WingId)), rng);
  const distractors = [...sameWing, ...others].slice(0, Math.max(0, total - expected.length)).map((s) => s.label);
  return shuffle([...expected, ...distractors], rng);
}

export function etiologyOptions(c: ClinicalCase, rng: Rng): string[] {
  if (!c.answer.etiology) return [];
  return shuffle([c.answer.etiology, ...c.answer.distractors], rng);
}
