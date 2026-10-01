import { create } from 'zustand';
import { db } from '../db/db';
import { DEFAULT_SETTINGS, type Settings } from './settingsTypes';

interface SettingsStore {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    try {
      const row = await db.settings.get('app');
      set({ settings: { ...DEFAULT_SETTINGS, ...row?.value }, loaded: true });
    } catch (e) {
      // IndexedDB can be unavailable (private mode): keep defaults in memory.
      console.warn('[settings] could not load, using defaults', e);
      set({ loaded: true });
    }
  },
  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    db.settings.put({ key: 'app', value: settings }).catch((e) => console.warn('[settings] save failed', e));
  },
}));
