import { describe, expect, it } from 'vitest';
import { rankFor } from './ranks';

describe('rankFor', () => {
  it('maps XP to ranks with README §6.1 thresholds', () => {
    expect(rankFor(0)).toMatchObject({ id: 'etudiant', floor: 0, next: 1000, ratio: 0 });
    expect(rankFor(999).id).toBe('etudiant');
    expect(rankFor(1000).id).toBe('externe');
    expect(rankFor(3000)).toMatchObject({ id: 'externe', ratio: 0.5 });
    expect(rankFor(119_999).id).toBe('professeur-agrege');
    expect(rankFor(500_000)).toMatchObject({ id: 'professeur', next: null, ratio: 1 });
  });
});
