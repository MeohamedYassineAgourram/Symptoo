import { describe, expect, it } from 'vitest';
import type { Card } from '../../content/schemas';
import { seededRng } from '../../utils/random';
import { generateQuestion } from './questionGenerator';
import { createGarde, gardeReducer, speedQuality, summarize, type GardeDeps } from './gardeRapideMachine';
import type { SessionSlot } from '../srs/session';

const mk = (id: string, back: string, extra: Partial<Card> = {}): Card => ({
  id,
  wing: 'neuro',
  type: 'card',
  tags: ['syndrome'],
  difficulty: 1,
  front: `${id} ?`,
  back,
  modes: ['garde-rapide'],
  status: 'validated',
  ...extra,
});

const cards: Card[] = [
  mk('a', 'Réponse A'),
  mk('b', 'Réponse B'),
  mk('c', 'Réponse C'),
  mk('d', 'Réponse D'),
  mk('e', 'Réponse A'), // duplicate answer text, must never appear twice
  mk('f', 'Réponse F', { wing: 'cardio', tags: ['definition'], status: 'draft' }),
];
const signs: Card[] = ['Murphy', 'Kernig', 'Brudzinski', 'Babinski'].map((n, i) =>
  mk(`s${i}`, i === 1 || i === 2 ? 'Syndrome méningé' : `Sens ${n}`, {
    tags: ['signe-eponyme'],
    term: `Signe de ${n}`,
    explanation: `Description ${n}`,
  }),
);

describe('generateQuestion', () => {
  it('builds 4 unique options including the right answer', () => {
    for (let seed = 0; seed < 30; seed++) {
      const q = generateQuestion(cards[0]!, cards, seededRng(seed));
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options[q.correctIndex]).toBe('Réponse A');
    }
  });

  it('prefers distractors with the same tag and wing', () => {
    const q = generateQuestion(cards[0]!, cards, seededRng(3));
    expect(q.options).not.toContain('Réponse F');
  });

  it('flags drafts', () => {
    expect(generateQuestion(cards[5]!, cards, seededRng(1)).isDraft).toBe(true);
  });

  it('asks eponymous signs in reverse sometimes, never duplicating meanings', () => {
    const directions = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const q = generateQuestion(signs[1]!, signs, seededRng(seed));
      directions.add(q.direction);
      if (q.direction === 'reverse') {
        expect(q.prompt).toBe('Description Kernig');
        expect(q.options[q.correctIndex]).toBe('Signe de Kernig');
      } else {
        // Brudzinski means the same thing: it must not appear as a distractor.
        expect(q.options.filter((o) => o === 'Syndrome méningé')).toHaveLength(1);
        expect(q.options).toHaveLength(3);
      }
    }
    expect(directions).toEqual(new Set(['forward', 'reverse']));
  });
});

describe('speedQuality', () => {
  it('maps answers to SM-2 grades', () => {
    expect(speedQuality(true, 2000, 4000)).toBe(5);
    expect(speedQuality(true, 6000, 4000)).toBe(4);
    expect(speedQuality(false, 1000, 4000)).toBe(1);
    expect(speedQuality(null, 1000, 4000)).toBe(0);
  });
});

describe('gardeReducer', () => {
  const pool = cards.slice(0, 4);
  const deps: GardeDeps = { cardsById: new Map(pool.map((c) => [c.id, c])), pool, rng: seededRng(7), fastAnswerMs: 4000 };
  const slots: SessionSlot[] = pool.map((c) => ({ itemId: c.id, kind: 'new' }));
  const run = (s: ReturnType<typeof createGarde>, e: Parameters<typeof gardeReducer>[1]) => gardeReducer(s, e, slots, deps);

  it('scores a correct answer, grades it and builds the combo', () => {
    let s = createGarde(slots, deps, 0);
    const q = s.current!.question;
    s = run(s, { type: 'ANSWER', index: q.correctIndex, now: 1000 });
    expect(s.phase).toBe('feedback');
    expect(s.score).toBe(100);
    expect(s.combo).toBe(1);
    expect(s.grades[q.itemId]).toBe(5);
    s = run(s, { type: 'NEXT', now: 1500 });
    expect(s.phase).toBe('playing');
    s = run(s, { type: 'ANSWER', index: s.current!.question.correctIndex, now: 8000 });
    expect(s.score).toBe(210);
    expect(Object.values(s.grades)).toEqual([5, 4]);
  });

  it('requeues a wrong answer 3–5 items later without grading it twice', () => {
    let s = createGarde(slots, deps, 0);
    const q = s.current!.question;
    s = run(s, { type: 'ANSWER', index: (q.correctIndex + 1) % q.options.length, now: 500 });
    expect(s.combo).toBe(0);
    expect(s.grades[q.itemId]).toBe(1);
    expect(s.queue.some((e) => e.itemId === q.itemId && e.retry)).toBe(true);
    // Play until the retry comes back, answering it correctly.
    for (let i = 0; i < 10 && !(s.current?.retry && s.current.question.itemId === q.itemId); i++) {
      s = run(s, { type: 'NEXT', now: 0 });
      if (s.current?.retry && s.current.question.itemId === q.itemId) break;
      s = run(s, { type: 'ANSWER', index: s.current!.question.correctIndex, now: 0 });
    }
    s = run(s, { type: 'ANSWER', index: s.current!.question.correctIndex, now: 0 });
    expect(s.grades[q.itemId]).toBe(1);
  });

  it('records « Je ne sais pas » as quality 0', () => {
    let s = createGarde(slots, deps, 0);
    const id = s.current!.question.itemId;
    s = run(s, { type: 'SKIP', now: 100 });
    expect(s.grades[id]).toBe(0);
  });

  it('loops the deck when it runs out and stops on TIME_UP', () => {
    let s = createGarde(slots, deps, 0);
    for (let i = 0; i < 12; i++) {
      s = run(s, { type: 'ANSWER', index: s.current!.question.correctIndex, now: 0 });
      s = run(s, { type: 'NEXT', now: 0 });
    }
    expect(s.phase).toBe('playing');
    expect(Object.keys(s.grades)).toHaveLength(4);
    s = run(s, { type: 'TIME_UP' });
    expect(s.phase).toBe('finished');
    const sum = summarize(s);
    expect(sum.answered).toBe(12);
    expect(sum.accuracy).toBe(1);
    expect(sum.bestCombo).toBe(12);
  });
});
