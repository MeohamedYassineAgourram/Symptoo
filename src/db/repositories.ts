import { db, type SessionLog } from './db';
import { review, type Quality, type SrsState } from '../features/srs/engine';
import { toDayString, type DayString } from '../utils/dates';
import { applyEvent, EMPTY_PROGRESS, type GameEvent, type ProgressState, type RewardSummary } from '../features/progression/applyEvent';
import { EMPTY_STATS } from '../features/progression/achievements';
import { EMPTY_STREAK, buyTea } from '../features/progression/streak';
import { masteryRatio } from '../features/progression/mastery';
import { wingItemIds } from '../content';
import { WING_IDS, type WingId } from '../content/wings';

export async function loadSrsStates(itemIds?: readonly string[]): Promise<Map<string, SrsState>> {
  const rows = itemIds ? await db.srs.bulkGet([...itemIds]) : await db.srs.toArray();
  return new Map(rows.filter((r): r is SrsState => !!r).map((r) => [r.itemId, r]));
}

export async function countIntroducedToday(today: DayString): Promise<number> {
  return db.srs.where('introducedOn').equals(today).count();
}

export async function countDue(today: DayString, itemIds?: ReadonlySet<string>): Promise<number> {
  const due = await db.srs.where('dueDate').belowOrEqual(today).toArray();
  return itemIds ? due.filter((s) => itemIds.has(s.itemId)).length : due.length;
}

/** Applies a batch of reviews atomically. */
export async function applyReviews(grades: Record<string, Quality>, today: DayString): Promise<void> {
  const ids = Object.keys(grades);
  if (!ids.length) return;
  await db.transaction('rw', db.srs, async () => {
    const existing = await db.srs.bulkGet(ids);
    const next = ids.map((id, i) => review(existing[i], id, grades[id]!, today));
    await db.srs.bulkPut(next);
  });
}

/** Reads the progress record, normalising the Phase 1 shape (streak as a number, achievements as a list). */
export async function getProgress(): Promise<ProgressState> {
  const raw = (await db.progress.get('me')) as (Partial<ProgressState> & Record<string, unknown>) | undefined;
  if (!raw) return EMPTY_PROGRESS;
  const legacyStreak = typeof raw.streak === 'number' ? (raw.streak as number) : null;
  return {
    ...EMPTY_PROGRESS,
    ...raw,
    streak: legacyStreak === null ? { ...EMPTY_STREAK, ...(raw.streak as object | undefined) } : { ...EMPTY_STREAK, current: legacyStreak },
    achievements: Array.isArray(raw.achievements) ? Object.fromEntries((raw.achievements as string[]).map((a) => [a, 0])) : (raw.achievements ?? {}),
    stats: { ...EMPTY_STATS, ...(raw.stats ?? {}) },
    seenWings: raw.seenWings ?? [],
    daily: raw.daily ?? {},
    lastVisiteDay: raw.lastVisiteDay ?? null,
  };
}

async function putProgress(p: ProgressState): Promise<void> {
  await db.progress.put({ key: 'me', ...p });
}

/** Mastery ratio per wing from the stored SM-2 states. */
export async function masteryByWing(includeDrafts: boolean): Promise<Record<WingId, number>> {
  const states = await loadSrsStates();
  return Object.fromEntries(WING_IDS.map((w) => [w, masteryRatio(wingItemIds(w, includeDrafts), states)])) as Record<WingId, number>;
}

/**
 * Saves a finished session and applies its rewards in one transaction:
 * XP, Dirhams, stats, streak, achievements, wing unlocks and the daily goal.
 */
export async function finishSession(
  log: SessionLog,
  event: GameEvent,
  opts: { dailyGoal: number; includeDrafts: boolean },
): Promise<{ progress: ProgressState; summary: RewardSummary }> {
  return db.transaction('rw', db.sessions, db.progress, db.srs, async () => {
    const mastery = await masteryByWing(opts.includeDrafts);
    const now = new Date();
    const result = applyEvent(await getProgress(), event, {
      today: toDayString(now),
      now: now.getTime(),
      dailyGoal: opts.dailyGoal,
      masteryByWing: mastery,
    });
    await db.sessions.add({ ...log, xpEarned: result.summary.xp, dhEarned: result.summary.dh });
    await putProgress(result.progress);
    return result;
  });
}

export async function markWingsSeen(wings: WingId[]): Promise<ProgressState> {
  return db.transaction('rw', db.progress, async () => {
    const p = await getProgress();
    const next = { ...p, seenWings: [...new Set([...p.seenWings, ...wings])] };
    await putProgress(next);
    return next;
  });
}

/** Buys a thé à la menthe (streak freeze). Returns null if not possible. */
export async function purchaseTea(): Promise<ProgressState | null> {
  return db.transaction('rw', db.progress, async () => {
    const p = await getProgress();
    const r = buyTea(p.streak, p.dirhams);
    if (!r) return null;
    const next = { ...p, streak: r.state, dirhams: r.dirhams };
    await putProgress(next);
    return next;
  });
}

export async function lastSessionWithReview(): Promise<SessionLog | null> {
  const all = await db.sessions.orderBy('startedAt').reverse().toArray();
  return all.find((s) => s.review?.some((r) => r.quality < 4)) ?? null;
}

export async function saveGarde(key: string, data: unknown): Promise<void> {
  await db.savedGardes.put({ key, data, savedAt: Date.now() });
}

export async function loadGarde<T>(key: string): Promise<T | null> {
  return ((await db.savedGardes.get(key))?.data as T | undefined) ?? null;
}

export async function clearGarde(key: string): Promise<void> {
  await db.savedGardes.delete(key);
}

export async function setFicheSaved(itemId: string, saved: boolean): Promise<void> {
  if (saved) await db.fiches.put({ itemId, savedAt: Date.now() });
  else await db.fiches.delete(itemId);
}

export async function isFicheSaved(itemId: string): Promise<boolean> {
  return !!(await db.fiches.get(itemId));
}
