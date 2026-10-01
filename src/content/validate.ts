import { ContentFileSchema, type ContentItem } from './schemas';
import { isValidZonePattern, rootOf, ROOT_ZONES } from './zones';
import syndromeConfig from '../config/syndromes.json';
import { normalizeText } from '../utils/normalize';

const SYNDROMES = new Set(syndromeConfig.syndromes.map((s) => normalizeText(s.label)));

export interface RawContentFile {
  /** Path relative to src/content, e.g. `pneumo/cards.json`. */
  path: string;
  data: unknown;
}

export interface ValidationResult {
  items: ContentItem[];
  errors: string[];
}

/** Validates every content file: schema, folder/wing match, unique ids and cross-field rules. */
export function validateContent(files: RawContentFile[]): ValidationResult {
  const items: ContentItem[] = [];
  const errors: string[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const parsed = ContentFileSchema.safeParse(file.data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${file.path} [${issue.path.join('.')}]: ${issue.message}`);
      }
      continue;
    }
    const folder = file.path.split('/')[0];
    for (const item of parsed.data) {
      const where = `${file.path} (${item.id})`;
      if (item.wing !== folder) errors.push(`${where}: wing "${item.wing}" does not match folder "${folder}"`);
      const dup = seen.get(item.id);
      if (dup) errors.push(`${where}: duplicate id, already defined in ${dup}`);
      seen.set(item.id, file.path);
      errors.push(...crossFieldErrors(item).map((e) => `${where}: ${e}`));
      items.push(item);
    }
  }
  return { items, errors };
}

function optionErrors(options: string[], correct: number[], type: string): string[] {
  const errors: string[] = [];
  if (correct.some((i) => i >= options.length)) errors.push('a correct index is out of range');
  if (new Set(correct).size !== correct.length) errors.push('duplicate correct index');
  if (type === 'qcm-unique' && correct.length !== 1) errors.push('qcm-unique needs exactly one correct answer');
  return errors;
}

function crossFieldErrors(item: ContentItem): string[] {
  switch (item.type) {
    case 'case': {
      const errors = item.exam
        .filter((f) => !isValidZonePattern(f.zone))
        .map((f) => `unknown exam zone "${f.zone}"`);
      for (const f of item.exam) {
        const tools = ROOT_ZONES.find((r) => r.id === rootOf(f.zone))?.tools ?? [];
        if (isValidZonePattern(f.zone) && !tools.includes(f.tool)) errors.push(`tool "${f.tool}" not allowed on zone "${f.zone}"`);
      }
      if (!item.history.some((h) => h.key)) errors.push('needs at least one key history item');
      if (!item.exam.some((f) => f.key)) errors.push('needs at least one key exam finding');
      for (const s of item.answer.syndrome) {
        if (!SYNDROMES.has(normalizeText(s))) errors.push(`syndrome "${s}" missing from config/syndromes.json`);
      }
      if (item.answer.etiology && item.answer.distractors.some((d) => normalizeText(d) === normalizeText(item.answer.etiology!))) {
        errors.push('a distractor equals the etiology');
      }
      if (item.bonusQuestion) {
        const b = item.bonusQuestion;
        errors.push(...optionErrors(b.options, b.correct, b.type).map((e) => `bonusQuestion: ${e}`));
      }
      return errors;
    }
    case 'qcm-unique':
    case 'qcm-multiple':
    case 'auscultation':
    case 'image':
      return optionErrors(item.options, item.correct, item.type);
    case 'cas-clinique':
      return item.questions.flatMap((q, i) =>
        q.type === 'qroc' ? [] : optionErrors(q.options, q.correct, q.type).map((e) => `question ${i + 1}: ${e}`),
      );
    default:
      return [];
  }
}
