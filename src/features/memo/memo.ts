import type { Card } from '../../content/schemas';
import { shuffle, type Rng } from '../../utils/random';
import type { Quality } from '../srs/engine';

/** Mémo (README §5.2): match a sign with its meaning, or a term with its definition. */
export interface Tile {
  id: number;
  pairId: string;
  text: string;
  side: 'term' | 'definition';
}

export interface MemoState {
  tiles: Tile[];
  /** Tile ids currently face up and not yet matched (0–2). */
  open: number[];
  matched: string[];
  moves: number;
  /** Pairs involved in at least one mismatch. */
  missed: string[];
  done: boolean;
}

const MAX_TILE_CHARS = 110;

/** Short label for the term side: the card's term, else its question without the trailing « : … ? ». */
export function termOf(c: Card): string {
  return c.term ?? c.front.replace(/\s*:\s*[^:]*\?\s*$/, '').trim();
}

/** Only cards with a real « term » side: a named sign/syndrome or a « Terme : … ? » question. */
export const isMemoCard = (c: Card) =>
  c.modes.includes('memo') && c.back.length <= MAX_TILE_CHARS && (!!c.term || / : [^:]*\?\s*$/.test(c.front)) && termOf(c).length <= 60;

export function buildBoard(cards: readonly Card[], pairs: number, rng: Rng): Tile[] {
  const chosen = shuffle(cards.filter(isMemoCard), rng);
  const seen = new Set<string>();
  const unique = chosen.filter((c) => (seen.has(c.back) ? false : (seen.add(c.back), true))).slice(0, pairs);
  const tiles = unique.flatMap((c) => [
    { pairId: c.id, text: termOf(c), side: 'term' as const },
    { pairId: c.id, text: c.back, side: 'definition' as const },
  ]);
  return shuffle(tiles, rng).map((t, id) => ({ ...t, id }));
}

export function createMemo(tiles: Tile[]): MemoState {
  return { tiles, open: [], matched: [], moves: 0, missed: [], done: tiles.length === 0 };
}

/** Flips a tile. A third flip first closes a mismatched pair. */
export function flip(s: MemoState, tileId: number): MemoState {
  const tile = s.tiles.find((t) => t.id === tileId);
  if (!tile || s.done || s.matched.includes(tile.pairId) || s.open.includes(tileId)) return s;
  const open = s.open.length >= 2 ? [tileId] : [...s.open, tileId];
  if (open.length < 2) return { ...s, open };
  const [a, b] = open.map((id) => s.tiles.find((t) => t.id === id)!) as [Tile, Tile];
  const moves = s.moves + 1;
  if (a.pairId === b.pairId) {
    const matched = [...s.matched, a.pairId];
    return { ...s, open: [], matched, moves, done: matched.length * 2 === s.tiles.length };
  }
  const missed = [...new Set([...s.missed, a.pairId, b.pairId])];
  return { ...s, open, moves, missed };
}

/** Closes a mismatched pair (called after a short delay so the player can read it). */
export function closeMismatch(s: MemoState): MemoState {
  return s.open.length === 2 ? { ...s, open: [] } : s;
}

export function memoQuality(s: MemoState, pairId: string): Quality {
  return s.missed.includes(pairId) ? 3 : 4;
}

export const isPerfect = (s: MemoState) => s.done && s.moves === s.tiles.length / 2;
