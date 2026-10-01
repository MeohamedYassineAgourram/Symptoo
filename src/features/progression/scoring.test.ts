import { describe, expect, it } from 'vitest';
import { scorePatient, scoreSpeedAnswer, streakMultiplier } from './scoring';

describe('streakMultiplier', () => {
  it('adds 0.1 per previous correct answer and caps at 2.0', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(3)).toBeCloseTo(1.3);
    expect(streakMultiplier(10)).toBe(2);
    expect(streakMultiplier(50)).toBe(2);
    expect(streakMultiplier(-1)).toBe(1);
  });
});

describe('scorePatient', () => {
  const base = { keyActions: 0, totalActions: 0, streak: 0 };

  it('gives a small flat score for a wrong diagnosis', () => {
    expect(scorePatient({ ...base, syndromeCorrect: false, etiologyCorrect: true, streak: 8 })).toBe(10);
  });
  it('gives 100 for a correct syndrome', () => {
    expect(scorePatient({ ...base, syndromeCorrect: true, etiologyCorrect: false })).toBe(100);
  });
  it('adds +50% when the étiologie is also correct', () => {
    expect(scorePatient({ ...base, syndromeCorrect: true, etiologyCorrect: true })).toBe(150);
  });
  it('gives the full +50 efficiency bonus with only key findings', () => {
    expect(scorePatient({ syndromeCorrect: true, etiologyCorrect: true, keyActions: 6, totalActions: 6, streak: 0 })).toBe(200);
  });
  it('scales the efficiency bonus with the share of key actions', () => {
    expect(scorePatient({ syndromeCorrect: true, etiologyCorrect: false, keyActions: 3, totalActions: 6, streak: 0 })).toBe(125);
  });
  it('applies the streak multiplier to the whole score', () => {
    expect(scorePatient({ syndromeCorrect: true, etiologyCorrect: true, keyActions: 6, totalActions: 6, streak: 2 })).toBe(240);
    expect(scorePatient({ syndromeCorrect: true, etiologyCorrect: true, keyActions: 6, totalActions: 6, streak: 20 })).toBe(400);
  });
});

describe('scoreSpeedAnswer', () => {
  it('scores 0 for a wrong answer and scales with combo', () => {
    expect(scoreSpeedAnswer(false, 5)).toBe(0);
    expect(scoreSpeedAnswer(true, 0)).toBe(100);
    expect(scoreSpeedAnswer(true, 4)).toBe(140);
    expect(scoreSpeedAnswer(true, 30)).toBe(200);
  });
});
