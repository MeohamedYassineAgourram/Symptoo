import Dexie, { type EntityTable } from 'dexie';
import type { SrsState } from '../features/srs/engine';
import type { ContentItem } from '../content/schemas';
import type { Settings } from '../stores/settingsTypes';
import type { ProgressState } from '../features/progression/applyEvent';

export interface Profile {
  key: 'me';
  name: string;
  faculty: string;
  year: number;
  createdAt: number;
}

/** The player's progress record (see ProgressState); older shapes are normalised on read. */
export interface Progress extends ProgressState {
  key: 'me';
}

/** One item reviewed in a session, kept for the Staff/RMM review. */
export interface ReviewEntry {
  itemId: string;
  quality: number;
  /** Key signs missed (consultation) — finding or answer texts. */
  missed?: string[];
  /** What the player answered, when wrong. */
  given?: string;
}

export interface SessionLog {
  id?: number;
  mode: 'garde-rapide' | 'consultation' | 'visite' | 'qui-suis-je' | 'memo';
  wing: string;
  startedAt: number;
  durationSec: number;
  answered: number;
  correct: number;
  score: number;
  bestCombo: number;
  xpEarned: number;
  dhEarned?: number;
  review?: ReviewEntry[];
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
