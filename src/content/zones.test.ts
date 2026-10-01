import { describe, expect, it } from 'vitest';
import { ROOT_ZONES, ZONES, isValidZonePattern, rootOf, toolsForZone, zoneMatches } from './zones';

describe('zone taxonomy', () => {
  it('rolls every zone up to a root zone', () => {
    const roots = new Set(ROOT_ZONES.map((r) => r.id));
    for (const z of ZONES.values()) expect(roots.has(z.root)).toBe(true);
  });

  it('has the 9 abdominal regions', () => {
    const regions = [...ZONES.values()].filter((z) => z.parent === 'abdomen' && !z.id.includes('lombaire'));
    expect(regions).toHaveLength(9);
  });

  it('resolves the zones used by the tuberculosis case', () => {
    expect(isValidZonePattern('general')).toBe(true);
    expect(isValidZonePattern('thorax-posterieur-droit-sommet')).toBe(true);
    expect(isValidZonePattern('aires-ganglionnaires-cervicales')).toBe(true);
    expect(isValidZonePattern('abdomen-*')).toBe(true);
    expect(rootOf('thorax-posterieur-droit-sommet')).toBe('thorax');
    expect(rootOf('abdomen-*')).toBe('abdomen');
  });

  it('rejects unknown zones and wildcards on leaf zones', () => {
    expect(isValidZonePattern('thorax-lateral')).toBe(false);
    expect(isValidZonePattern('peau-*')).toBe(false);
    expect(isValidZonePattern('nope-*')).toBe(false);
  });

  it('matches wildcards against descendants only', () => {
    expect(zoneMatches('abdomen-*', 'abdomen-fosse-iliaque-droite')).toBe(true);
    expect(zoneMatches('abdomen-*', 'abdomen')).toBe(false);
    expect(zoneMatches('thorax-*', 'thorax-posterieur-gauche-base')).toBe(true);
    expect(zoneMatches('thorax-posterieur-droit-sommet', 'thorax-posterieur-droit-sommet')).toBe(true);
    expect(zoneMatches('thorax-posterieur-droit-sommet', 'thorax-posterieur-droit-base')).toBe(false);
  });

  it('enables only relevant tools per zone', () => {
    expect(toolsForZone('abdomen-epigastre')).toContain('percussion');
    expect(toolsForZone('neuro-reflexes')).toContain('marteau');
    expect(toolsForZone('aires-ganglionnaires-axillaires')).not.toContain('auscultation');
  });
});

describe('manœuvres tool', () => {
  it('is available for abdominal, limb and neurological manœuvres only', () => {
    expect(toolsForZone('abdomen-fosse-iliaque-droite')).toContain('manoeuvre');
    expect(toolsForZone('membres-inferieurs-jambes')).toContain('manoeuvre');
    expect(toolsForZone('neuro-signes-meninges')).toContain('manoeuvre');
    expect(toolsForZone('thorax-anterieur-droit')).not.toContain('manoeuvre');
  });

  it('no longer allows palpation for the neurological examination', () => {
    expect(toolsForZone('neuro-signes-meninges')).not.toContain('palpation');
  });
});
