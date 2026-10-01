/**
 * Answer matching for typed answers (QROC, synthèse): case/accent-insensitive,
 * punctuation-tolerant, with small typo tolerance on long words.
 */

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´\-_/.,;:!?()«»"[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = curr;
  }
  return prev[b.length]!;
}

/** Words longer than 6 letters tolerate up to 2 edits; shorter words must match exactly. */
function wordsMatch(input: string, expected: string): boolean {
  if (input === expected) return true;
  if (expected.length <= 6) return false;
  return levenshtein(input, expected) <= 2;
}

export function matchesAnswer(input: string, expected: string): boolean {
  const a = normalizeText(input);
  const b = normalizeText(expected);
  if (!a || !b) return false;
  if (a === b) return true;
  const aw = a.split(' ');
  const bw = b.split(' ');
  if (aw.length !== bw.length) return false;
  return aw.every((w, i) => wordsMatch(w, bw[i]!));
}

export function matchesAnyAnswer(input: string, accepted: readonly string[]): boolean {
  return accepted.some((answer) => matchesAnswer(input, answer));
}
