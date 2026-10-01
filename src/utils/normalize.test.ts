import { describe, expect, it } from 'vitest';
import { levenshtein, matchesAnswer, matchesAnyAnswer, normalizeText } from './normalize';

describe('normalizeText', () => {
  it('lowercases, strips accents and collapses spaces', () => {
    expect(normalizeText('  Épanchement   PLEURAL  ')).toBe('epanchement pleural');
  });
  it('expands ligatures and treats hyphens/apostrophes as spaces', () => {
    expect(normalizeText('Œdème hépato-jugulaire')).toBe('oedeme hepato jugulaire');
    expect(normalizeText("Signe d'Hoover")).toBe('signe d hoover');
  });
});

describe('levenshtein', () => {
  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', 'abc')).toBe(0);
  });
});

describe('matchesAnswer', () => {
  it('ignores case and accents', () => {
    expect(matchesAnswer('cholecystite aigue', 'Cholécystite aiguë')).toBe(true);
  });
  it('tolerates up to 2 typos on words over 6 letters', () => {
    expect(matchesAnswer('tuberculose pulmonnaire', 'Tuberculose pulmonaire')).toBe(true);
    expect(matchesAnswer('tubrculose', 'tuberculose')).toBe(true);
    expect(matchesAnswer('tbrclose', 'tuberculose')).toBe(false);
  });
  it('requires exact match on short words', () => {
    expect(matchesAnswer('bpcp', 'BPCO')).toBe(false);
    expect(matchesAnswer('bpco', 'BPCO')).toBe(true);
  });
  it('rejects different word counts and empty input', () => {
    expect(matchesAnswer('tuberculose', 'tuberculose pulmonaire')).toBe(false);
    expect(matchesAnswer('   ', 'tuberculose')).toBe(false);
  });
  it('matches against a synonym list', () => {
    const accepted = ['Tuberculose pulmonaire', 'tuberculose', 'TB pulmonaire'];
    expect(matchesAnyAnswer('tb pulmonaire', accepted)).toBe(true);
    expect(matchesAnyAnswer('cancer bronchique', accepted)).toBe(false);
  });
});
