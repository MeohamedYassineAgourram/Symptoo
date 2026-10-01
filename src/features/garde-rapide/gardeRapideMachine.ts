import type { Card } from '../../content/schemas';
import type { Quality } from '../srs/engine';
import { requeueOffset } from '../srs/engine';
import type { SessionSlot, SessionSlotKind } from '../srs/session';
import { scoreSpeedAnswer } from '../progression/scoring';
import { shuffle, type Rng } from '../../utils/random';
import { generateQuestion, type SpeedQuestion } from './questionGenerator';

interface QueueEntry {
  itemId: string;
  kind: SessionSlotKind;
  /** Re-asked in the same round (after a mistake or when the deck loops): not graded again. */
  retry: boolean;
}

export interface AnswerRecord {
  itemId: string;
  question: SpeedQuestion;
  selectedIndex: number | null;
  correct: boolean;
  ms: number;
  retry: boolean;
}

export interface GardeState {
  phase: 'playing' | 'feedback' | 'finished';
  queue: QueueEntry[];
  current: { question: SpeedQuestion; kind: SessionSlotKind; retry: boolean; startedAt: number } | null;
  last: AnswerRecord | null;
  score: number;
  combo: number;
  bestCombo: number;
  answers: AnswerRecord[];
  /** First-attempt SM-2 grades, keyed by item id. */
  grades: Record<string, Quality>;
}

export type GardeEvent =
  | { type: 'ANSWER'; index: number; now: number }
  | { type: 'SKIP'; now: number }
  | { type: 'NEXT'; now: number }
  | { type: 'TIME_UP' };

export interface GardeDeps {
  cardsById: ReadonlyMap<string, Card>;
  /** Cards used for distractors. */
  pool: readonly Card[];
  rng: Rng;
  fastAnswerMs: number;
}

/** Garde rapide grading: correct in under `fastAnswerMs` = 5, correct = 4, wrong = 1, « Je ne sais pas » = 0. */
export function speedQuality(correct: boolean | null, ms: number, fastAnswerMs: number): Quality {
  if (correct === null) return 0;
  if (!correct) return 1;
  return ms < fastAnswerMs ? 5 : 4;
}

export function createGarde(slots: readonly SessionSlot[], deps: GardeDeps, now: number): GardeState {
  const queue = slots.map((s) => ({ itemId: s.itemId, kind: s.kind, retry: false }));
  const base: GardeState = {
    phase: 'playing',
    queue: shuffle(queue, deps.rng),
    current: null,
    last: null,
    score: 0,
    combo: 0,
    bestCombo: 0,
    answers: [],
    grades: {},
  };
  return advance(base, slots, deps, now);
}

/** Pops the next question; when the deck runs out it loops (ungraded) so the round never stalls. */
function advance(state: GardeState, slots: readonly SessionSlot[], deps: GardeDeps, now: number): GardeState {
  let queue = state.queue;
  if (!queue.length) {
    if (!slots.length) return { ...state, phase: 'finished', current: null };
    queue = shuffle(
      slots.map((s) => ({ itemId: s.itemId, kind: s.kind, retry: true })),
      deps.rng,
    );
    // Avoid asking the same card twice in a row across the loop boundary.
    if (queue.length > 1 && queue[0]!.itemId === state.current?.question.itemId) queue.push(queue.shift()!);
  }
  const [next, ...rest] = queue;
  const card = deps.cardsById.get(next!.itemId);
  if (!card) return advance({ ...state, queue: rest }, slots, deps, now);
  return {
    ...state,
    phase: 'playing',
    queue: rest,
    current: { question: generateQuestion(card, deps.pool, deps.rng), kind: next!.kind, retry: next!.retry, startedAt: now },
  };
}

export function gardeReducer(
  state: GardeState,
  event: GardeEvent,
  slots: readonly SessionSlot[],
  deps: GardeDeps,
): GardeState {
  if (state.phase === 'finished') return state;

  switch (event.type) {
    case 'ANSWER':
    case 'SKIP': {
      if (state.phase !== 'playing' || !state.current) return state;
      const { question, retry, kind, startedAt } = state.current;
      const selectedIndex = event.type === 'ANSWER' ? event.index : null;
      const correct = selectedIndex === question.correctIndex;
      const ms = Math.max(0, event.now - startedAt);
      const record: AnswerRecord = { itemId: question.itemId, question, selectedIndex, correct, ms, retry };

      const combo = correct ? state.combo + 1 : 0;
      const grades = { ...state.grades };
      if (!retry && !(question.itemId in grades)) {
        grades[question.itemId] = speedQuality(event.type === 'SKIP' ? null : correct, ms, deps.fastAnswerMs);
      }

      let queue = state.queue;
      if (!correct) {
        const at = Math.min(queue.length, requeueOffset(deps.rng));
        queue = [...queue.slice(0, at), { itemId: question.itemId, kind, retry: true }, ...queue.slice(at)];
      }

      return {
        ...state,
        phase: 'feedback',
        queue,
        last: record,
        score: state.score + scoreSpeedAnswer(correct, state.combo),
        combo,
        bestCombo: Math.max(state.bestCombo, combo),
        answers: [...state.answers, record],
        grades,
      };
    }
    case 'NEXT':
      if (state.phase !== 'feedback') return state;
      return advance(state, slots, deps, event.now);
    case 'TIME_UP':
      // The question on screen when time runs out is left ungraded.
      return { ...state, phase: 'finished' };
  }
}

export interface GardeSummary {
  answered: number;
  correct: number;
  accuracy: number;
  score: number;
  bestCombo: number;
  /** Distinct items answered wrongly at least once, for the end-of-round correction. */
  mistakes: AnswerRecord[];
}

export function summarize(state: GardeState): GardeSummary {
  const answered = state.answers.length;
  const correct = state.answers.filter((a) => a.correct).length;
  const seen = new Set<string>();
  const mistakes = state.answers.filter((a) => {
    if (a.correct || seen.has(a.itemId)) return false;
    seen.add(a.itemId);
    return true;
  });
  return {
    answered,
    correct,
    accuracy: answered ? correct / answered : 0,
    score: state.score,
    bestCombo: state.bestCombo,
    mistakes,
  };
}
