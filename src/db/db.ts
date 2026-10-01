import Dexie, { type EntityTable } from 'dexie';
import type { SrsState } from '../features/srs/engine';
import type { ContentItem } from '../content/schemas';
import type { Settings } from '../stores/settingsTypes';

export interface Profile {
  key: 'me';
  name: string;
  faculty: string;
  year: number;
  createdAt: number;
}

export interface Progress {
  key: 'me';
  xp: number;
  dirhams: number;
  streak: number;
  bestStreak: number;
  lastPlayedDay: string | null;
  achievements: string[];
}

export interface SessionLog {
  id?: number;
  mode: 'garde-rapide' | 'consultation';
  wing: string;
  startedAt: number;
  durationSec: number;
  answered: number;
  correct: number;
  score: number;
  bestCombo: number;
  xpEarned: number;
}

export interface CustomContent {
  id: string;
  item: ContentItem;
  updatedAt: number;
}

/** An unfinished garde, so leaving mid-garde resumes on the same patient (README §9). */
export interface SavedGarde {
  key: string;
  data: unknown;
  savedAt: number;
}

/** A fiche mémo the student chose to keep. */
export interface SavedFiche {
  itemId: string;
  savedAt: number;
}

export interface SettingsRow {
  key: 'app';
  value: Settings;
}

export class SemioDb extends Dexie {
  profile!: EntityTable<Profile, 'key'>;
  progress!: EntityTable<Progress, 'key'>;
  srs!: EntityTable<SrsState, 'itemId'>;
  sessions!: EntityTable<SessionLog, 'id'>;
  customContent!: EntityTable<CustomContent, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;
  savedGardes!: EntityTable<SavedGarde, 'key'>;
  fiches!: EntityTable<SavedFiche, 'itemId'>;

  constructor() {
    super('semiogarde');
    this.version(1).stores({
      profile: 'key',
      progress: 'key',
      srs: 'itemId, dueDate, introducedOn',
      sessions: '++id, mode, wing, startedAt',
      customContent: 'id, updatedAt',
      settings: 'key',
    });
    this.version(2).stores({
      savedGardes: 'key',
      fiches: 'itemId, savedAt',
    });
  }
}

export const db = new SemioDb();
