import { useCallback } from 'react';
import { finishSession } from '../../db/repositories';
import type { SessionLog } from '../../db/db';
import { useProgress } from '../../stores/progressStore';
import { useRewards } from '../../stores/rewardStore';
import { useSettings } from '../../stores/settingsStore';
import type { GameEvent, RewardSummary } from './applyEvent';

/** Saves a session, applies its rewards and queues the celebration overlay. */
export function useFinishSession() {
  const setProgress = useProgress((s) => s.set);
  const push = useRewards((s) => s.push);
  const dailyGoal = useSettings((s) => s.settings.dailyGoal);
  const includeDrafts = useSettings((s) => s.settings.includeDrafts);
  return useCallback(
    async (log: SessionLog, event: GameEvent): Promise<RewardSummary> => {
      const { progress, summary } = await finishSession(log, event, { dailyGoal, includeDrafts });
      setProgress(progress);
      push(summary);
      return summary;
    },
    [setProgress, push, dailyGoal, includeDrafts],
  );
}
