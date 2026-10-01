import { describe, expect, it } from 'vitest';
import type { Card } from '../../content/schemas';
import { seededRng } from '../../utils/random';
import { buildRound, cluesFor, gradeRound, isPlayable } from './quiSuisJe';
import { buildBoard, closeMismatch, createMemo, flip, isMemoCard, isPerfect, memoQuality, termOf } from '../memo/memo';

const card = (id: string, extra: Partial<Card>): Card => ({
  id,
  wing: 'neuro',
  type: 'card',
  tags: [],
  difficulty: 1,
  front: `${id} : signification ?`,
  back: `sens ${id}`,
  modes: ['qui-suis-je', 'memo'],
  status: 'validated',
  ...extra,
});
const signs = ['Kernig', 'Babinski', 'Lasègue', 'Murphy', 'Romberg'].map((n) => card(n.toLowerCase(), { term: `Signe de ${n}`, explanation: `description ${n}` }));
const syndromes = ['Condensation', 'Pneumothorax'].map((n) => card(n.toLowerCase(), { term: n, clues: ['Percussion : x', 'Vibrations : y', 'Auscultation : z'] }));

describe('Qui suis-je', () => {
  it('reveals description, then system, then meaning by default', () => {
    expect(cluesFor(signs[0]!, 'Appareil : Neurologie')).toEqual(['description Kernig', 'Appareil : Neurologie', 'sens kernig']);
    expect(cluesFor(syndromes[0]!, 'x')).toEqual(['Percussion : x', 'Vibrations : y', 'Auscultation : z']);
  });

  it('only plays named cards with clue material', () => {
    expect(isPlayable(signs[0]!)).toBe(true);
    expect(isPlayable(card('x', {}))).toBe(false);
  });

  it('builds 4 unique options, preferring the same family', () => {
    for (let seed = 0; seed < 20; seed++) {
      const r = buildRound(signs[0]!, [...signs, ...syndromes], 'sys', seededRng(seed));
      expect(r.options).toHaveLength(4);
      expect(new Set(r.options).size).toBe(4);
      expect(r.options[r.correctIndex]).toBe('Signe de Kernig');
      expect(r.options.every((o) => o.startsWith('Signe de'))).toBe(true);
    }
  });

  it('scores fewer clues higher and maps to SM-2 qualities', () => {
    expect(gradeRound(1, true)).toEqual({ points: 100, quality: 5, found: true });
    expect(gradeRound(2, true)).toEqual({ points: 60, quality: 4, found: true });
    expect(gradeRound(3, true)).toEqual({ points: 30, quality: 3, found: true });
    expect(gradeRound(3, false)).toEqual({ points: 0, quality: 1, found: false });
    expect(gradeRound(1, null)).toEqual({ points: 0, quality: 0, found: false });
  });
});

describe('Mémo', () => {
  const memoCards = signs;
  it('labels the term side from the term or the question', () => {
    expect(termOf(signs[0]!)).toBe('Signe de Kernig');
    expect(termOf(card('polyurie', { front: 'Polyurie : définition ?' }))).toBe('Polyurie');
    expect(isMemoCard(card('long', { back: 'x'.repeat(200) }))).toBe(false);
    expect(isMemoCard(card('q', { front: 'Première étiologie à évoquer au Maroc ?' }))).toBe(false);
  });

  it('builds a shuffled board of term/definition pairs', () => {
    const tiles = buildBoard(memoCards, 4, seededRng(3));
    expect(tiles).toHaveLength(8);
    expect(new Set(tiles.map((t) => t.pairId)).size).toBe(4);
  });

  it('matches pairs, counts moves and finishes', () => {
    const tiles = buildBoard(memoCards.slice(0, 2), 2, seededRng(1));
    let s = createMemo(tiles);
    const pairOf = (pid: string) => tiles.filter((t) => t.pairId === pid).map((t) => t.id);
    const [a1, a2] = pairOf(tiles[0]!.pairId) as [number, number];
    const other = tiles.find((t) => t.pairId !== tiles[0]!.pairId)!;
    // A mismatch stays open until closed, and marks both pairs as missed.
    s = flip(flip(s, a1), other.id);
    expect(s.open).toHaveLength(2);
    expect(s.missed).toHaveLength(2);
    s = closeMismatch(s);
    s = flip(flip(s, a1), a2);
    expect(s.matched).toEqual([tiles[0]!.pairId]);
    const [b1, b2] = pairOf(other.pairId) as [number, number];
    s = flip(flip(s, b1), b2);
    expect(s.done).toBe(true);
    expect(s.moves).toBe(3);
    expect(isPerfect(s)).toBe(false);
    expect(memoQuality(s, other.pairId)).toBe(3);
  });

  it('ignores flips on matched or already-open tiles', () => {
    const tiles = buildBoard(memoCards.slice(0, 2), 2, seededRng(2));
    const s = flip(createMemo(tiles), tiles[0]!.id);
    expect(flip(s, tiles[0]!.id)).toBe(s);
  });

  it('detects a perfect game', () => {
    const tiles = buildBoard(memoCards.slice(0, 1), 1, seededRng(2));
    const s = flip(flip(createMemo(tiles), tiles[0]!.id), tiles[1]!.id);
    expect(isPerfect(s)).toBe(true);
    expect(memoQuality(s, tiles[0]!.pairId)).toBe(4);
  });
});
