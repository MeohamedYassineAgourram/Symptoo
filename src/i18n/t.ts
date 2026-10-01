import fr from './fr.json';

type Dict = typeof fr;

/** Dot paths to string leaves of the dictionary, e.g. `hub.start`. */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends readonly unknown[] ? never : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Dot paths to string-array leaves, e.g. `garde.praise`. */
type ListLeaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly string[] ? `${P}${K}` : T[K] extends string ? never : ListLeaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type I18nKey = Leaves<Dict>;
export type I18nListKey = ListLeaves<Dict>;

function lookup(path: string): unknown {
  return path.split('.').reduce<unknown>((node, k) => (node as Record<string, unknown> | undefined)?.[k], fr);
}

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  const value = lookup(key);
  if (typeof value !== 'string') return key;
  return vars ? value.replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v] ?? `{${v}}`)) : value;
}

export function tList(key: I18nListKey): string[] {
  const value = lookup(key);
  return Array.isArray(value) ? (value as string[]) : [];
}

/** Dynamic keys (e.g. built from a wing id) — falls back to the key itself if missing. */
export function tDynamic(key: string, vars?: Record<string, string | number>): string {
  return t(key as I18nKey, vars);
}
