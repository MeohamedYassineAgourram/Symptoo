import { create } from 'zustand';
import { getProgress } from '../db/repositories';
import { EMPTY_PROGRESS, type ProgressState } from '../features/progression/applyEvent';

interface ProgressStore {
  progress: ProgressState;
  loaded: boolean;
  refresh: () => Promise<void>;
  set: (p: ProgressState) => void;
}

export const useProgress = create<ProgressStore>((set) => ({
  progress: EMPTY_PROGRESS,
  loaded: false,
  refresh: async () => {
    try {
      set({ progress: await getProgress(), loaded: true });
    } catch (e) {
      console.warn('[progress] could not load', e);
      set({ loaded: true });
    }
  },
  set: (progress) => set({ progress }),
}));
