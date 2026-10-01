import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { RawContentFile } from '../src/content/validate.ts';

export const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content');

/** Reads every `src/content/<wing>/*.json` file from disk (Node-side twin of import.meta.glob). */
export function readContentFiles(): RawContentFile[] {
  const files: RawContentFile[] = [];
  for (const entry of readdirSync(CONTENT_DIR)) {
    const dir = join(CONTENT_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      const full = join(dir, name);
      const path = relative(CONTENT_DIR, full).split('\\').join('/');
      try {
        files.push({ path, data: JSON.parse(readFileSync(full, 'utf8')) });
      } catch (e) {
        files.push({ path, data: { __parseError: String(e) } });
      }
    }
  }
  return files;
}
