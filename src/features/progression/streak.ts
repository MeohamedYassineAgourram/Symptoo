import progression from '../../config/progression.json';
import { diffDays, type DayString } from '../../utils/dates';

const S = progression.streak;

/** Daily streak kept by completing the Visite du matin (README §5.2, §6.5). */
export interface StreakState {
  current: number;
  best: number;
  lastDay: DayString | null;
  /** Thé à la menthe: each one protects the streak for one missed day (max 2). */
  teas: number;
  /** Days on which the streak was extended (for the Agenda). */
  history: DayString[];
}

export const EMPTY_STREAK: StreakState = { current: 0, best: 0, lastDay: null, teas: 0, history: [] };

export interface StreakUpdate {
  state: StreakState;
  extended: boolean;
  usedTeas: number;
}

/** Completing the day's challenge: extends the streak, spending teas on missed days if needed. */
export function completeDay(s: StreakState, today: DayString): StreakUpdate {
  if (s.lastDay === today) return { state: s, extended: false, usedTeas: 0 };
  let current = 1;
  let teas = s.teas;
  let usedTeas = 0;
  if (s.lastDay) {
    const missed = diffDays(s.lastDay, today) - 1;
    if (missed <= 0) current = s.current + 1;
    else if (missed <= teas) {
      usedTeas = missed;
      teas -= missed;
      current = s.current + 1;
    }
  }
  const history = [...s.history, today].slice(-S.historyDays);
  return { state: { current, best: Math.max(s.best, current), lastDay: today, teas, history }, extended: true, usedTeas };
}

/** Streak to display today: still alive if the missed days are covered by teas. */
export function displayStreak(s: StreakState, today: DayString): number {
  if (!s.lastDay) return 0;
  const missed = diffDays(s.lastDay, today) - 1;
  return missed <= s.teas ? s.current : 0;
}

/** Buys a thé à la menthe with Dirhams; null if too poor or already holding the maximum. */
export function buyTea(s: StreakState, dirhams: number): { state: StreakState; dirhams: number } | null {
  if (s.teas >= S.maxTeas || dirhams < S.teaCost) return null;
  return { state: { ...s, teas: s.teas + 1 }, dirhams: dirhams - S.teaCost };
}
