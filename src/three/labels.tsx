import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector3 } from 'three';
import { placeLabels } from './labelLayout';

/**
 * Screen-space labels for 3D objects without one React root per label (drei <Html> creates
 * a root per element). DOM labels register themselves here; <LabelProjector> moves them every
 * frame to the projected position of their 3D anchor and resolves overlaps: a label is nudged
 * up or down, and if it still collides it collapses to a small coloured dot (still tappable).
 */
const elements = new Map<string, HTMLElement>();

export function registerLabel(id: string, el: HTMLElement | null) {
  if (el) elements.set(id, el);
  else elements.delete(id);
}

export interface LabelAnchor {
  id: string;
  position: [number, number, number];
}

export function LabelProjector({ anchors, selected }: { anchors: readonly LabelAnchor[]; selected?: string | null }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const sizes = useMemo(() => new Map<string, { w: number; h: number; text: string }>(), []);

  useFrame(() => {
    const items = [];
    for (const a of anchors) {
      const el = elements.get(a.id);
      if (!el) continue;
      v.set(...a.position).project(camera);
      // Measure the full label once per text (collapsed labels are smaller).
      const text = el.textContent ?? '';
      let s = sizes.get(a.id);
      if (!s || s.text !== text) {
        const wasCollapsed = el.dataset.collapsed === 'true';
        if (wasCollapsed) el.dataset.collapsed = 'false';
        s = { w: el.offsetWidth, h: el.offsetHeight, text };
        sizes.set(a.id, s);
        if (wasCollapsed) el.dataset.collapsed = 'true';
      }
      items.push({
        id: a.id,
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
        w: s.w,
        h: s.h,
        priority: a.id === selected ? 1 : 0,
      });
    }
    for (const p of placeLabels(items)) {
      const el = elements.get(p.id)!;
      const half = (p.collapsed ? 12 : (sizes.get(p.id)?.w ?? 0)) / 2 + 6;
      const x = Math.min(Math.max(p.x, half), size.width - half);
      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      el.style.visibility = 'visible';
      el.style.zIndex = p.id === selected ? '2' : '1';
      const c = String(p.collapsed);
      if (el.dataset.collapsed !== c) el.dataset.collapsed = c;
    }
  });
  return null;
}
