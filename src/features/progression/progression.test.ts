import { describe, expect, it } from 'vitest';
import { rankUps } from './ranks';
import { buyTea, completeDay, displayStreak, EMPTY_STREAK, type StreakState } from './streak';
import { isModeUnlocked, isWingUnlocked, newlyUnlockedWings, nextWingUnlock, unlockedWings } from './unlocks';
import { masteryRatio, masteryTier } from './mastery';
import { consultationGain, gardeRapideGain, memoGain, quiSuisJeGain } from './rewards';
import { ACHIEVEMENTS, EMPTY_STATS, mergeStats, newAchievements } from './achievements';
import { applyEvent, EMPTY_PROGRESS, type EventContext } from './applyEvent';
import type { SrsState } from '../srs/engine';

const ctx = (over: Partial<EventContext> = {}): EventContext => ({ today: '2026-10-10', now: 1, dailyGoal: 20, masteryByWing: {}, ...over });

describe('ranks', () => {
  it('lists every rank crossed by an XP gain', () => {
    expect(rankUps(900, 1100)).toEqual(['externe']);
    expect(rankUps(900, 6000)).toEqual(['externe', 'interne']);
    expect(rankUps(1000, 1200)).toEqual([]);
  });
});

describe('streak and thé à la menthe', () => {
  const s = (over: Partial<StreakState>): StreakState => ({ ...EMPTY_STREAK, ...over });

  it('starts at 1 and grows on consecutive days', () => {
    const d1 = completeDay(EMPTY_STREAK, '2026-10-01').state;
    expect(d1.current).toBe(1);
    const d2 = completeDay(d1, '2026-10-02');
    expect(d2).toMatchObject({ extended: true, usedTeas: 0 });
    expect(d2.state.current).toBe(2);
  });

  it('does not count the same day twice', () => {
    const d1 = completeDay(EMPTY_STREAK, '2026-10-01').state;
    expect(completeDay(d1, '2026-10-01')).toMatchObject({ extended: false, state: d1 });
  });

  it('spends one tea per missed day to keep the streak', () => {
    const u = completeDay(s({ current: 5, best: 5, lastDay: '2026-10-01', teas: 2 }), '2026-10-04');
    expect(u.usedTeas).toBe(2);
    expect(u.state).toMatchObject({ current: 6, teas: 0, best: 6 });
  });

  it('resets when the missed days exceed the teas, keeping the best', () => {
    const u = completeDay(s({ current: 9, best: 9, lastDay: '2026-10-01', teas: 1 }), '2026-10-05');
    expect(u.state).toMatchObject({ current: 1, teas: 1, best: 9 });
  });

  it('displays a protected streak and hides a broken one', () => {
    const st = s({ current: 4, lastDay: '2026-10-01', teas: 1 });
    expect(displayStreak(st, '2026-10-02')).toBe(4);
    expect(displayStreak(st, '2026-10-03')).toBe(4);
    expect(displayStreak(st, '2026-10-04')).toBe(0);
    expect(displayStreak(EMPTY_STREAK, '2026-10-04')).toBe(0);
  });

  it('sells teas for 100 DH, at most 2', () => {
    expect(buyTea(s({ teas: 0 }), 150)).toMatchObject({ dirhams: 50, state: { teas: 1 } });
    expect(buyTea(s({ teas: 2 }), 500)).toBeNull();
    expect(buyTea(s({ teas: 0 }), 99)).toBeNull();
  });
});

describe('unlock rules', () => {
  it('opens Urgences and Pneumologie at the start', () => {
    expect(unlockedWings(0)).toEqual(['generale', 'pneumo']);
  });
  it('opens the next wings with XP', () => {
    expect(isWingUnlocked('cardio', 299)).toBe(false);
    expect(isWingUnlocked('cardio', 300)).toBe(true);
    expect(newlyUnlockedWings(250, 900)).toEqual(['cardio', 'digestif']);
    expect(nextWingUnlock(300)).toEqual({ wing: 'digestif', xp: 800 });
    expect(nextWingUnlock(99999)).toBeNull();
  });
  it('locks Qui suis-je and Mémo until the Externe rank', () => {
    expect(isModeUnlocked('consultation', 0)).toBe(true);
    expect(isModeUnlocked('qui-suis-je', 999)).toBe(false);
    expect(isModeUnlocked('memo', 1000)).toBe(true);
  });
  it('unlocks everything with the test setting', () => {
    expect(unlockedWings(0, true)).toHaveLength(10);
    expect(isModeUnlocked('boss', 0, true)).toBe(true);
  });
});

describe('mastery', () => {
  const st = (interval: number) => ({ interval }) as SrsState;
  it('counts items with an interval of 21 days or more', () => {
    const states = new Map([['a', st(30)], ['b', st(5)], ['c', st(21)]]);
    expect(masteryRatio(['a', 'b', 'c', 'd'], states)).toBe(0.5);
    expect(masteryRatio([], states)).toBe(0);
  });
  it('maps ratios to 25/50/75/100 % tiers', () => {
    expect([0, 0.24, 0.25, 0.5, 0.74, 0.75, 0.99, 1].map(masteryTier)).toEqual([0, 0, 1, 2, 2, 3, 3, 4]);
  });
});

describe('rewards', () => {
  it('converts consultation scores to XP and diagnoses to Dirhams', () => {
    expect(consultationGain([{ score: 200, syndrome: 'correct' }, { score: 10, syndrome: 'partial' }, { score: 10, syndrome: 'wrong' }])).toEqual({ xp: 22, dh: 7 });
  });
  it('rewards the other modes', () => {
    expect(gardeRapideGain(13)).toEqual({ xp: 130, dh: 6 });
    expect(quiSuisJeGain(260, 4)).toEqual({ xp: 26, dh: 4 });
    expect(memoGain(6, true)).toEqual({ xp: 50, dh: 3 });
  });
});

describe('achievements', () => {
  it('merges stats, keeping maxima for records', () => {
    const s = mergeStats({ ...EMPTY_STATS, patients: 2, bestCombo: 7 }, { patients: 3, bestCombo: 5 });
    expect(s).toMatchObject({ patients: 5, bestCombo: 7 });
  });
  it('awards achievements once their target is reached', () => {
    const c = { stats: { ...EMPTY_STATS, patients: 1, ictereInspections: 10 }, bestStreak: 0, rankId: 'etudiant', masteryByWing: {} };
    expect(newAchievements(c, [])).toEqual(['premier-patient', 'oeil-de-lynx']);
    expect(newAchievements(c, ['premier-patient'])).toEqual(['oeil-de-lynx']);
  });
  it('tracks the Marathon streak, the Externe rank and Pneumologie mastery', () => {
    const c = { stats: EMPTY_STATS, bestStreak: 30, rankId: 'externe', masteryByWing: { pneumo: 1 } };
    expect(newAchievements(c, [])).toEqual(['marathon', 'externe', 'pneumologue-en-herbe']);
  });
  it('has unique ids', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe('applyEvent', () => {
  it('adds XP and Dirhams, counts patients and detects a rank-up with new wings', () => {
    const p = { ...EMPTY_PROGRESS, xp: 990, achievements: { 'premier-patient': 1 } };
    const { progress, summary } = applyEvent(p, { xp: 40, dh: 10, stats: { patients: 2 }, patients: 2 }, ctx());
    expect(progress.xp).toBe(1030);
    expect(summary.rankUps).toEqual(['externe']);
    expect(summary.wings).toEqual([]);
    expect(summary.achievements).toEqual(['externe']);
    expect(progress.dirhams).toBe(10 + 25);
    expect(summary.daily).toEqual({ count: 2, goal: 20 });
    expect(progress.daily['2026-10-10']).toBe(2);
  });

  it('unlocks wings crossed by the XP gain', () => {
    const { summary } = applyEvent({ ...EMPTY_PROGRESS, xp: 250 }, { xp: 100, dh: 0, stats: {}, patients: 0 }, ctx());
    expect(summary.wings).toEqual(['cardio']);
  });

  it('extends the streak and grants the bonus for the Visite du matin', () => {
    const { progress, summary } = applyEvent(
      EMPTY_PROGRESS,
      { xp: 20, dh: 5, stats: { visites: 1 }, patients: 3, completesDay: true, bonus: { xp: 100, dh: 50 } },
      ctx(),
    );
    expect(summary.streak).toEqual({ before: 0, after: 1, usedTeas: 0 });
    expect(progress.lastVisiteDay).toBe('2026-10-10');
    expect(summary.xp).toBe(120);
    expect(progress.dirhams).toBe(55);
  });

  it('accumulates the daily count across sessions of the same day', () => {
    const first = applyEvent(EMPTY_PROGRESS, { xp: 0, dh: 0, stats: {}, patients: 4 }, ctx()).progress;
    expect(applyEvent(first, { xp: 0, dh: 0, stats: {}, patients: 6 }, ctx()).summary.daily.count).toBe(10);
  });
});
