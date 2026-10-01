/** Hospital wings (README §8.1), in curriculum/display order. Display names live in i18n. */
export const WING_IDS = [
  'generale',
  'cardio',
  'pneumo',
  'digestif',
  'neuro',
  'nephro',
  'endo',
  'locomoteur',
  'hemato',
  'dermato',
] as const;

export type WingId = (typeof WING_IDS)[number];

export interface WingTheme {
  /** CSS custom property holding the pastel background (README §3.3). */
  bgVar: string;
  /** Strong accent used on the wing's building sign and roof trim. */
  accent: string;
}

export const WING_THEMES: Record<WingId, WingTheme> = {
  generale: { bgVar: '--bg-generale', accent: '#2E8B7A' },
  cardio: { bgVar: '--bg-cardio', accent: '#D9534F' },
  pneumo: { bgVar: '--bg-pneumo', accent: '#3C8DC5' },
  digestif: { bgVar: '--bg-digestif', accent: '#D9962B' },
  neuro: { bgVar: '--bg-neuro', accent: '#7E64C2' },
  nephro: { bgVar: '--bg-nephro', accent: '#3FA58A' },
  endo: { bgVar: '--bg-endo', accent: '#E08A3C' },
  locomoteur: { bgVar: '--bg-rhumato', accent: '#8C7A5B' },
  hemato: { bgVar: '--bg-hemato', accent: '#C94F7C' },
  dermato: { bgVar: '--bg-dermato', accent: '#C27A55' },
};

export function isWingId(value: string | undefined): value is WingId {
  return !!value && (WING_IDS as readonly string[]).includes(value);
}
