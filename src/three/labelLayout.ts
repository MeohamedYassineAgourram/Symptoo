/** Pure label placement for the hub overlay (no three.js, unit-tested). */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Rect, b: Rect, pad = 3) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w + pad * 2 && Math.abs(a.y - b.y) * 2 < a.h + b.h + pad * 2;

export interface PlacedLabel {
  id: string;
  x: number;
  y: number;
  collapsed: boolean;
}

/**
 * Greedy placement (pure, unit-testable): labels are placed in priority order; each tries
 * its anchor, then small vertical nudges; if all collide it collapses to a dot.
 */
export function placeLabels(
  items: { id: string; x: number; y: number; w: number; h: number; priority: number }[],
  dot = 12,
): PlacedLabel[] {
  const placed: Rect[] = [];
  const out: PlacedLabel[] = [];
  const order = [...items].sort((a, b) => b.priority - a.priority || a.y - b.y);
  for (const it of order) {
    const step = it.h + 2;
    const tries = it.priority > 0 ? [0] : [0, -step * 0.6, step * 0.6, -step, step];
    let done = false;
    for (const dy of tries) {
      const r = { x: it.x, y: it.y + dy, w: it.w, h: it.h };
      if (it.priority > 0 || !placed.some((p) => overlaps(p, r))) {
        placed.push(r);
        out.push({ id: it.id, x: r.x, y: r.y, collapsed: false });
        done = true;
        break;
      }
    }
    if (!done) {
      placed.push({ x: it.x, y: it.y, w: dot, h: dot });
      out.push({ id: it.id, x: it.x, y: it.y, collapsed: true });
    }
  }
  return out;
}

