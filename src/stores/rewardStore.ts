import { create } from 'zustand';
import type { RewardSummary } from '../features/progression/applyEvent';

/** Celebrations waiting to be shown by the reward overlay, in order. */
interface RewardStore {
  queue: RewardSummary[];
  push: (r: RewardSummary) => void;
  shift: () => void;
}

export const useRewards = create<RewardStore>((set) => ({
  queue: [],
  push: (r) => set((s) => ({ queue: [...s.queue, r] })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
}));
