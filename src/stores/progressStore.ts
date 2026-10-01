import { create } from 'zustand';
import type { Progress } from '../db/db';
import { DEFAULT_PROGRESS, getProgress } from '../db/repositories';

interface ProgressStore {
  progress: Progress;
  refresh: () => Promise<void>;
  set: (p: Progress) => void;
}

export const useProgress = create<ProgressStore>((set) => ({
  progress: DEFAULT_PROGRESS,
  refresh: async () => {
    try {
      set({ progress: await getProgress() });
    } catch (e) {
      console.warn('[progress] could not load', e);
    }
  },
  set: (progress) => set({ progress }),
}));
