import progression from '../../config/progression.json';

export interface RankInfo {
  id: string;
  /** XP needed for the current rank and the next one (null at max rank). */
  floor: number;
  next: number | null;
  /** 0..1 progress toward the next rank. */
  ratio: number;
}

export function rankFor(xp: number): RankInfo {
  const ranks = progression.ranks;
  let i = 0;
  while (i + 1 < ranks.length && xp >= ranks[i + 1]!.xp) i++;
  const floor = ranks[i]!.xp;
  const next = ranks[i + 1]?.xp ?? null;
  return { id: ranks[i]!.id, floor, next, ratio: next === null ? 1 : (xp - floor) / (next - floor) };
}

/** Ranks reached when XP goes from `before` to `after` (several if a big gain skips one). */
export function rankUps(before: number, after: number): string[] {
  return progression.ranks.filter((r) => r.xp > before && r.xp <= after).map((r) => r.id);
}

export function rankIndex(id: string): number {
  return progression.ranks.findIndex((r) => r.id === id);
}
