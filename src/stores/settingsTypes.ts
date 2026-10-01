import faculties from '../config/faculties.json';
import { WING_IDS, type WingId } from '../content/wings';

export type ThemeMode = 'system' | 'light' | 'dark';
export type QualityPreset = 'auto' | 'haute' | 'moyenne' | 'basse';

export interface Settings {
  theme: ThemeMode;
  quality: QualityPreset;
  includeDrafts: boolean;
  showDarija: boolean;
  reducedMotion: boolean;
  faculty: string;
  year: number;
  modules: WingId[];
  dailyGoal: number;
  gardeRapideSeconds: 60 | 90;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  quality: 'auto',
  includeDrafts: true,
  showDarija: true,
  reducedMotion: false,
  faculty: faculties.defaultFaculty,
  year: faculties.defaultYear,
  modules: [...WING_IDS],
  dailyGoal: 20,
  gardeRapideSeconds: 60,
};
