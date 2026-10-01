import type { SrsState } from '../srs/engine';
import { addDays, type DayString } from '../../utils/dates';

/** Follow-ups due per day for the Agenda (README §7.4); overdue items count today. */
export function dueByDay(states: Iterable<SrsState>, today: DayString, days: number): { day: DayString; count: number }[] {
  const out = Array.from({ length: days }, (_, i) => ({ day: addDays(today, i), count: 0 }));
  const last = out[out.length - 1]!.day;
  for (const s of states) {
    if (s.dueDate > last) continue;
    const i = s.dueDate <= today ? 0 : out.findIndex((d) => d.day === s.dueDate);
    if (i >= 0) out[i]!.count++;
  }
  return out;
}

/** Share of reviews graded 3+ (correct) for a set of items, from the SM-2 history. */
export function accuracyOf(itemIds: readonly string[], states: ReadonlyMap<string, SrsState>): { accuracy: number | null; reviews: number } {
  let reviews = 0;
  let ok = 0;
  for (const id of itemIds) {
    for (const h of states.get(id)?.history ?? []) {
      reviews++;
      if (h.quality >= 3) ok++;
    }
  }
  return { accuracy: reviews ? ok / reviews : null, reviews };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}
