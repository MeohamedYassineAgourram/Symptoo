import progression from '../../config/progression.json';
import { WING_IDS, type WingId } from '../../content/wings';

const U = progression.unlocks;

export type GameMode = keyof typeof U.modes;

/** XP needed to open a wing (0 for the starting wings). */
export function wingUnlockXp(wing: WingId): number {
  if (U.initialWings.includes(wing)) return 0;
  return U.wings.find((w) => w.id === wing)?.xp ?? Infinity;
}

export function isWingUnlocked(wing: WingId, xp: number, unlockAll = false): boolean {
  return unlockAll || xp >= wingUnlockXp(wing);
}

export function unlockedWings(xp: number, unlockAll = false): WingId[] {
  return WING_IDS.filter((w) => isWingUnlocked(w, xp, unlockAll));
}

/** Wings opened by an XP gain from `before` to `after`. */
export function newlyUnlockedWings(before: number, after: number): WingId[] {
  return WING_IDS.filter((w) => {
    const need = wingUnlockXp(w);
    return need > before && need <= after;
  });
}

export function nextWingUnlock(xp: number): { wing: WingId; xp: number } | null {
  const next = U.wings.find((w) => w.xp > xp);
  return next ? { wing: next.id as WingId, xp: next.xp } : null;
}

export function modeUnlockXp(mode: GameMode): number {
  return U.modes[mode];
}

export function isModeUnlocked(mode: GameMode, xp: number, unlockAll = false): boolean {
  return unlockAll || xp >= U.modes[mode];
}

/** Modes opened by an XP gain (rank table, README §6.1). */
export function newlyUnlockedModes(before: number, after: number): GameMode[] {
  return (Object.keys(U.modes) as GameMode[]).filter((m) => U.modes[m] > before && U.modes[m] <= after);
}
