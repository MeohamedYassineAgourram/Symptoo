import { describe, expect, it } from 'vitest';
import { Color } from 'three';
import { patientColors, SKIN_TONES } from './patientLook';

const hsl = (hex: string) => new Color(hex).getHSL({ h: 0, s: 0, l: 0 });

describe('patientColors', () => {
  it('uses the base skin tone without signs', () => {
    const c = patientColors({ skinTone: 3, visibleSigns: [] });
    expect(c.skin).toBe(SKIN_TONES[2]);
    expect(c.sclera).toBe('#ffffff');
    expect(c.fingertips).toBe(c.skin);
  });

  it('yellows skin and sclera in ictère', () => {
    const base = patientColors({ skinTone: 2, visibleSigns: [] });
    const c = patientColors({ skinTone: 2, visibleSigns: ['ictere'] });
    expect(c.sclera).not.toBe('#ffffff');
    expect(hsl(c.skin).s).toBeGreaterThan(hsl(base.skin).s);
  });

  it('lightens skin and lips in pâleur', () => {
    const base = patientColors({ skinTone: 4, visibleSigns: [] });
    const c = patientColors({ skinTone: 4, visibleSigns: ['paleur'] });
    expect(hsl(c.skin).l).toBeGreaterThan(hsl(base.skin).l);
    expect(hsl(c.lips).l).toBeGreaterThan(hsl(base.lips).l);
  });

  it('turns lips and fingertips blue in cyanose', () => {
    const c = patientColors({ skinTone: 1, visibleSigns: ['cyanose'] });
    const h = hsl(c.lips).h * 360;
    expect(h).toBeGreaterThan(200);
    expect(h).toBeLessThan(260);
    expect(c.fingertips).not.toBe(c.skin);
  });

  it('clamps out-of-range skin tones', () => {
    expect(patientColors({ skinTone: 99, visibleSigns: [] }).skin).toBe(SKIN_TONES[5]);
  });
});
