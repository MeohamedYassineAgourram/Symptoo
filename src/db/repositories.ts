import { db, type Progress, type SessionLog } from './db';
import { review, type Quality, type SrsState } from '../features/srs/engine';
import type { DayString } from '../utils/dates';

export const DEFAULT_PROGRESS: Progress = {
  key: 'me',
  xp: 0,
  dirhams: 0,
  streak: 0,
  bestStreak: 0,
  lastPlayedDay: null,
  achievements: [],
};

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

export async function getProgress(): Promise<Progress> {
  return (await db.progress.get('me')) ?? DEFAULT_PROGRESS;
}

/** Saves a finished session and credits its XP. */
export async function recordSession(log: SessionLog): Promise<Progress> {
  return db.transaction('rw', db.sessions, db.progress, async () => {
    await db.sessions.add(log);
    const progress = await getProgress();
    const next = { ...progress, xp: progress.xp + log.xpEarned };
    await db.progress.put(next);
    return next;
  });
}
