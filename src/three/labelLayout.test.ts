import { describe, expect, it } from 'vitest';
import { placeLabels } from './labelLayout';

const rect = (id: string, x: number, y: number, priority = 0) => ({ id, x, y, w: 60, h: 20, priority });

describe('placeLabels', () => {
  it('keeps separated labels at their anchors', () => {
    const out = placeLabels([rect('a', 0, 0), rect('b', 200, 0)]);
    expect(out.every((p) => !p.collapsed && p.y === 0)).toBe(true);
  });

  it('nudges a colliding label vertically', () => {
    const out = placeLabels([rect('a', 0, 0), rect('b', 10, 4)]);
    const b = out.find((p) => p.id === 'b')!;
    expect(b.collapsed).toBe(false);
    expect(Math.abs(b.y - 4)).toBeGreaterThan(0);
  });

  it('collapses a label to a dot when every nudge collides', () => {
    const crowd = [rect('a', 0, 0), rect('b', 0, -25), rect('c', 0, 25), rect('d', 0, -14), rect('e', 0, 14), rect('f', 0, 2)];
    const out = placeLabels(crowd);
    expect(out.some((p) => p.collapsed)).toBe(true);
  });

  it('never moves or collapses the selected label, which always shows in full', () => {
    const out = placeLabels([rect('a', 0, 0), rect('sel', 5, 2, 1)]);
    expect(out.find((p) => p.id === 'sel')).toMatchObject({ x: 5, y: 2, collapsed: false });
  });
});
