import { describe, expect, it } from 'vitest';
import { hubDecor } from './hubDecor';
import { HUB_PAVILLONS } from './HubScene';

const one = HUB_PAVILLONS.filter((p) => p.id === 'pneumo');

describe('hubDecor', () => {
  it('adds nothing around an unmastered unlocked wing', () => {
    const d = hubDecor(one, { pneumo: 0 }, []);
    expect(Object.values(d).every((v) => v.length === 0)).toBe(true);
  });

  it('gets busier with each mastery tier', () => {
    const count = (tier: number) => {
      const d = hubDecor(one, { pneumo: tier }, []);
      return d.trees.length + d.bushes.length + d.people.length + d.benches.length + d.lanternPosts.length + d.flowers.length;
    };
    const counts = [0, 1, 2, 3, 4].map(count);
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1]!);
  });

  it('shows scaffolding and cones, and no decor, on a locked wing', () => {
    const d = hubDecor(one, { pneumo: 4 }, ['pneumo']);
    expect(d.poles).toHaveLength(4);
    expect(d.cones).toHaveLength(2);
    expect(d.trees).toHaveLength(0);
  });

  it('keeps decor on the slab and off the entrance road', () => {
    const d = hubDecor(HUB_PAVILLONS, Object.fromEntries(HUB_PAVILLONS.map((p) => [p.id, 4])), []);
    for (const p of [...d.trees, ...d.bushes, ...d.flowers]) {
      expect(Math.abs(p.position[0])).toBeLessThanOrEqual(10.8);
      expect(p.position[2]).toBeLessThanOrEqual(9.6);
    }
  });
});
