import type { WingId } from '../../content/wings';
import { rankIndex } from './ranks';

/** Lifetime counters behind achievements and statistics. */
export interface Stats {
  patients: number;
  correctDiagnoses: number;
  gardes: number;
  visites: number;
  /** Inspections that looked for jaundice on a patient who had it. */
  ictereInspections: number;
  /** Key findings revealed in a precise abdominal region. */
  abdominalKeyFindings: number;
  auscultationKeyFindings: number;
  /** Correct diagnoses reached using only key questions and exam actions. */
  noNetDiagnoses: number;
  nightGardes: number;
  bestCombo: number;
  /** Qui suis-je signs named on the first clue. */
  firstClueGuesses: number;
  memoBoards: number;
  perfectMemos: number;
  bestGardeScore: number;
  studySeconds: number;
}

export const EMPTY_STATS: Stats = {
  patients: 0,
  correctDiagnoses: 0,
  gardes: 0,
  visites: 0,
  ictereInspections: 0,
  abdominalKeyFindings: 0,
  auscultationKeyFindings: 0,
  noNetDiagnoses: 0,
  nightGardes: 0,
  bestCombo: 0,
  firstClueGuesses: 0,
  memoBoards: 0,
  perfectMemos: 0,
  bestGardeScore: 0,
  studySeconds: 0,
};

/** Counters that keep their maximum instead of adding up. */
const MAX_STATS: (keyof Stats)[] = ['bestCombo', 'bestGardeScore'];

export function mergeStats(base: Stats, delta: Partial<Stats>): Stats {
  const out = { ...base };
  for (const [k, v] of Object.entries(delta) as [keyof Stats, number][]) {
    out[k] = MAX_STATS.includes(k) ? Math.max(out[k], v) : out[k] + v;
  }
  return out;
}

export interface AchievementContext {
  stats: Stats;
  bestStreak: number;
  rankId: string;
  masteryByWing: Partial<Record<WingId, number>>;
}

export interface Achievement {
  id: string;
  icon: string;
  /** [current, target] so the Profil screen can show progress. */
  progress: (c: AchievementContext) => [number, number];
}

const counter = (target: number, get: (c: AchievementContext) => number) => (c: AchievementContext) =>
  [Math.min(get(c), target), target] as [number, number];

/** README §6.4 examples plus a few early ones so the first sessions feel rewarding. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'premier-patient', icon: '🩺', progress: counter(1, (c) => c.stats.patients) },
  { id: 'premiere-garde', icon: '🏥', progress: counter(1, (c) => c.stats.gardes) },
  { id: 'oeil-de-lynx', icon: '👁', progress: counter(10, (c) => c.stats.ictereInspections) },
  { id: 'main-experte', icon: '✋', progress: counter(50, (c) => c.stats.abdominalKeyFindings) },
  { id: 'oreille-d-or', icon: '🎧', progress: counter(20, (c) => c.stats.auscultationKeyFindings) },
  { id: 'garde-de-nuit', icon: '🌙', progress: counter(1, (c) => c.stats.nightGardes) },
  { id: 'sans-filet', icon: '🎯', progress: counter(1, (c) => c.stats.noNetDiagnoses) },
  { id: 'combo-10', icon: '⚡', progress: counter(10, (c) => c.stats.bestCombo) },
  { id: 'detective', icon: '🕵️', progress: counter(5, (c) => c.stats.firstClueGuesses) },
  { id: 'memoire-elephant', icon: '🧠', progress: counter(1, (c) => c.stats.perfectMemos) },
  { id: 'leve-tot', icon: '☀️', progress: counter(7, (c) => c.stats.visites) },
  { id: 'marathon', icon: '🔥', progress: counter(30, (c) => c.bestStreak) },
  { id: 'externe', icon: '🎓', progress: counter(1, (c) => (rankIndex(c.rankId) >= rankIndex('externe') ? 1 : 0)) },
  { id: 'pneumologue-en-herbe', icon: '🫁', progress: counter(100, (c) => Math.floor((c.masteryByWing.pneumo ?? 0) * 100)) },
];

export function isUnlocked(a: Achievement, c: AchievementContext): boolean {
  const [n, target] = a.progress(c);
  return n >= target;
}

/** Achievements newly earned in this context (ids not yet in `owned`). */
export function newAchievements(c: AchievementContext, owned: Iterable<string>): string[] {
  const have = new Set(owned);
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && isUnlocked(a, c)).map((a) => a.id);
}
