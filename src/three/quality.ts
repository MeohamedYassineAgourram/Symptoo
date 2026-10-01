import { useSettings } from '../stores/settingsStore';

export type ResolvedPreset = 'haute' | 'moyenne' | 'basse';

export interface QualityProfile {
  preset: ResolvedPreset;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  /** 0..1 multiplier for decorative props (people, trees). */
  density: number;
}

const PROFILES: Record<ResolvedPreset, QualityProfile> = {
  haute: { preset: 'haute', dpr: [1, 2], shadows: true, shadowMapSize: 2048, antialias: true, density: 1 },
  moyenne: { preset: 'moyenne', dpr: [1, 1.5], shadows: true, shadowMapSize: 1024, antialias: true, density: 0.75 },
  basse: { preset: 'basse', dpr: [1, 1], shadows: false, shadowMapSize: 512, antialias: false, density: 0.45 },
};

/**
 * Heuristic preset for "Auto". The GPU benchmark from README §4.5 replaces this in Phase 6.
 */
export function detectPreset(): ResolvedPreset {
  if (typeof navigator === 'undefined') return 'moyenne';
  const cores = navigator.hardwareConcurrency ?? 4;
  const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  if (cores <= 2) return 'basse';
  return touch ? 'moyenne' : 'haute';
}

export function useQuality(): QualityProfile {
  const setting = useSettings((s) => s.settings.quality);
  return PROFILES[setting === 'auto' ? detectPreset() : setting];
}
