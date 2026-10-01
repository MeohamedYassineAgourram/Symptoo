import { validateContent, type RawContentFile } from './validate';
import type { Card, ContentItem, PracticeMode } from './schemas';
import type { WingId } from './wings';

const modules = import.meta.glob<unknown>('./*/*.json', { eager: true, import: 'default' });

const files: RawContentFile[] = Object.entries(modules).map(([path, data]) => ({
  path: path.replace(/^\.\//, ''),
  data,
}));

const { items, errors } = validateContent(files);
if (errors.length) {
  // The build already fails on invalid content (npm run validate:content); this guards dev mode.
  console.error(`[content] ${errors.length} invalid item(s):\n${errors.join('\n')}`);
}

export const allItems: readonly ContentItem[] = items;
export const itemsById: ReadonlyMap<string, ContentItem> = new Map(items.map((i) => [i.id, i]));
export const allCards: readonly Card[] = items.filter((i): i is Card => i.type === 'card');

export function itemsByWing(wing: WingId): ContentItem[] {
  return items.filter((i) => i.wing === wing);
}

export function itemsByTag(tag: string): ContentItem[] {
  return items.filter((i) => i.tags.includes(tag));
}

export function itemsByType<T extends ContentItem['type']>(type: T): Extract<ContentItem, { type: T }>[] {
  return items.filter((i): i is Extract<ContentItem, { type: T }> => i.type === type);
}

export interface PracticeFilter {
  wing: WingId | 'toutes';
  mode: PracticeMode;
  includeDrafts: boolean;
}

/** Cards playable in a practice mode, in curriculum order. Drafts never reach exam modes. */
export function practiceCards({ wing, mode, includeDrafts }: PracticeFilter): Card[] {
  return allCards.filter(
    (c) =>
      (wing === 'toutes' || c.wing === wing) &&
      c.modes.includes(mode) &&
      (includeDrafts || c.status === 'validated'),
  );
}
