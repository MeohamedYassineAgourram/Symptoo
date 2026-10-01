import { describe, expect, it } from 'vitest';
import { ABDOMEN_GRID, leafGroups } from './zoneTree';
import { ZONES } from '../../content/zones';

describe('leafGroups', () => {
  it('returns the root itself for flat regions', () => {
    expect(leafGroups('general')).toEqual([{ parent: 'general', leaves: ['general'] }]);
    expect(leafGroups('peau')).toEqual([{ parent: 'peau', leaves: ['peau'] }]);
  });

  it('groups thorax leaves by parent', () => {
    const groups = leafGroups('thorax');
    expect(groups.map((g) => g.parent)).toEqual([
      'thorax-anterieur',
      'thorax-anterieur-cardiaque',
      'thorax-posterieur-droit',
      'thorax-posterieur-gauche',
    ]);
    expect(groups.flatMap((g) => g.leaves)).toContain('thorax-posterieur-droit-sommet');
  });

  it('covers every leaf zone exactly once across all roots', () => {
    const leaves = [...ZONES.values()].filter((z) => ![...ZONES.values()].some((c) => c.parent === z.id)).map((z) => z.id);
    const listed = ['general', 'tete', 'cou', 'thorax', 'abdomen', 'aires-ganglionnaires', 'membres', 'peau', 'neuro'].flatMap((r) =>
      leafGroups(r).flatMap((g) => g.leaves),
    );
    expect([...listed].sort()).toEqual([...leaves].sort());
  });

  it('has a valid 3×3 abdominal grid', () => {
    expect(ABDOMEN_GRID).toHaveLength(9);
    expect(ABDOMEN_GRID.every((z) => ZONES.has(z))).toBe(true);
  });
});
