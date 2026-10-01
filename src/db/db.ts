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
  mode: 'garde-rapide';
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
  }
}

export const db = new SemioDb();
