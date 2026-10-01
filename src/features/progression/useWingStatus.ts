import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { wingItemIds } from '../../content';
import { WING_IDS, type WingId } from '../../content/wings';
import type { SrsState } from '../srs/engine';
import { useProgress } from '../../stores/progressStore';
import { useSettings } from '../../stores/settingsStore';
import { masteryRatio, masteryTier } from './mastery';
import { isWingUnlocked, wingUnlockXp } from './unlocks';

export interface WingStatus {
  wing: WingId;
  unlocked: boolean;
  unlockXp: number;
  mastery: number;
  tier: 0 | 1 | 2 | 3 | 4;
}

/** Live lock state and mastery for every wing (hub, wing screen, profile). */
export function useWingStatus(): Record<WingId, WingStatus> {
  const xp = useProgress((s) => s.progress.xp);
  const unlockAll = useSettings((s) => s.settings.unlockAll);
  const includeDrafts = useSettings((s) => s.settings.includeDrafts);
  const rows = useLiveQuery(() => db.srs.toArray(), [], [] as SrsState[]);
  return useMemo(() => {
    const states = new Map(rows.map((r) => [r.itemId, r]));
    return Object.fromEntries(
      WING_IDS.map((wing) => {
        const mastery = masteryRatio(wingItemIds(wing, includeDrafts), states);
        return [wing, { wing, unlocked: isWingUnlocked(wing, xp, unlockAll), unlockXp: wingUnlockXp(wing), mastery, tier: masteryTier(mastery) }];
      }),
    ) as Record<WingId, WingStatus>;
  }, [rows, xp, unlockAll, includeDrafts]);
}
