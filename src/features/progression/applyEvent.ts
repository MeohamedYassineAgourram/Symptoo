import progression from '../../config/progression.json';
import type { WingId } from '../../content/wings';
import type { DayString } from '../../utils/dates';
import { EMPTY_STATS, mergeStats, newAchievements, type Stats } from './achievements';
import { rankFor, rankUps } from './ranks';
import { completeDay, EMPTY_STREAK, type StreakState } from './streak';
import { newlyUnlockedWings } from './unlocks';

/** Everything the player owns (persisted as one record). */
export interface ProgressState {
  xp: number;
  dirhams: number;
  streak: StreakState;
  /** Achievement id → unlock time (ms). */
  achievements: Record<string, number>;
  stats: Stats;
  /** Wings whose unlock animation has been shown on the hub. */
  seenWings: WingId[];
  /** Patients (items answered) per day, for the daily goal. */
  daily: Record<DayString, number>;
  lastVisiteDay: DayString | null;
}

export const EMPTY_PROGRESS: ProgressState = {
  xp: 0,
  dirhams: 0,
  streak: EMPTY_STREAK,
  achievements: {},
  stats: EMPTY_STATS,
  seenWings: [],
  daily: {},
  lastVisiteDay: null,
};

/** A finished game session, as seen by the reward system. */
export interface GameEvent {
  xp: number;
  dh: number;
  stats: Partial<Stats>;
  /** Patients / items answered, counted toward the daily goal. */
  patients: number;
  /** True when the Visite du matin was completed (keeps the streak). */
  completesDay?: boolean;
  bonus?: { xp: number; dh: number };
}

export interface RewardSummary {
  xp: number;
  dh: number;
  xpBefore: number;
  xpAfter: number;
  rankUps: string[];
  achievements: string[];
  achievementDh: number;
  wings: WingId[];
  streak: { before: number; after: number; usedTeas: number } | null;
  daily: { count: number; goal: number };
  /** Beat the previous best garde score. */
  record: boolean;
}

export interface EventContext {
  today: DayString;
  now: number;
  dailyGoal: number;
  masteryByWing: Partial<Record<WingId, number>>;
}

/** Pure reward step: applies a session to the progress and describes what to celebrate. */
export function applyEvent(p: ProgressState, e: GameEvent, ctx: EventContext): { progress: ProgressState; summary: RewardSummary } {
  const xpGain = e.xp + (e.bonus?.xp ?? 0);
  let dh = e.dh + (e.bonus?.dh ?? 0);
  const xpAfter = p.xp + xpGain;
  const stats = mergeStats(p.stats, e.stats);

  let streak = p.streak;
  let streakInfo: RewardSummary['streak'] = null;
  let lastVisiteDay = p.lastVisiteDay;
  if (e.completesDay) {
    const u = completeDay(p.streak, ctx.today);
    if (u.extended) streakInfo = { before: p.streak.current, after: u.state.current, usedTeas: u.usedTeas };
    streak = u.state;
    lastVisiteDay = ctx.today;
  }

  const earned = newAchievements(
    { stats, bestStreak: streak.best, rankId: rankFor(xpAfter).id, masteryByWing: ctx.masteryByWing },
    Object.keys(p.achievements),
  );
  const achievementDh = earned.length * progression.rewards.achievementDh;
  dh += achievementDh;

  const count = (p.daily[ctx.today] ?? 0) + e.patients;
  // Keep two months of daily counts.
  const entries: [string, number][] = [...Object.entries(p.daily).filter(([d]) => d !== ctx.today), [ctx.today, count]];
  const daily = Object.fromEntries(entries.sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-60));

  return {
    progress: {
      ...p,
      xp: xpAfter,
      dirhams: p.dirhams + dh,
      streak,
      stats,
      achievements: { ...p.achievements, ...Object.fromEntries(earned.map((id) => [id, ctx.now])) },
      daily,
      lastVisiteDay,
    },
    summary: {
      xp: xpGain,
      dh,
      xpBefore: p.xp,
      xpAfter,
      rankUps: rankUps(p.xp, xpAfter),
      achievements: earned,
      achievementDh,
      wings: newlyUnlockedWings(p.xp, xpAfter),
      streak: streakInfo,
      daily: { count, goal: ctx.dailyGoal },
      record: p.stats.bestGardeScore > 0 && (e.stats.bestGardeScore ?? 0) > p.stats.bestGardeScore,
    },
  };
}
