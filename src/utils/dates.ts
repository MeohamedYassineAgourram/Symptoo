/** A calendar day in local time, formatted `YYYY-MM-DD`. Lexicographic order = chronological order. */
export type DayString = string;

export function toDayString(date: Date): DayString {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDay(day: DayString): Date {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function addDays(day: DayString, days: number): DayString {
  const date = parseDay(day);
  date.setDate(date.getDate() + days);
  return toDayString(date);
}

/** Whole days from `a` to `b` (positive when `b` is later). DST-safe. */
export function diffDays(a: DayString, b: DayString): number {
  const ms = Date.UTC(...utcParts(b)) - Date.UTC(...utcParts(a));
  return Math.round(ms / 86_400_000);
}

function utcParts(day: DayString): [number, number, number] {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return [y, m - 1, d];
}
