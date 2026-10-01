import progression from '../../config/progression.json';
import { isMastered, type SrsState } from '../srs/engine';

/** Share of a wing's items in the "maîtrisé" SM-2 state (README §6.3). */
export function masteryRatio(itemIds: readonly string[], states: ReadonlyMap<string, SrsState>): number {
  if (!itemIds.length) return 0;
  return itemIds.filter((id) => isMastered(states.get(id))).length / itemIds.length;
}

/** 0..4: thresholds 25/50/75/100% upgrade the wing diorama and give a badge. */
export function masteryTier(ratio: number): 0 | 1 | 2 | 3 | 4 {
  return progression.mastery.thresholds.filter((t) => ratio >= t - 1e-9).length as 0 | 1 | 2 | 3 | 4;
}
