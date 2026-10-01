import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector3 } from 'three';

/**
 * Screen-space labels for 3D objects without one React root per label (drei <Html> creates
 * a root per element). DOM labels register themselves here; <LabelProjector> moves them
 * every frame to the projected position of their 3D anchor.
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

export function LabelProjector({ anchors }: { anchors: readonly LabelAnchor[] }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  useFrame(() => {
    for (const a of anchors) {
      const el = elements.get(a.id);
      if (!el) continue;
      v.set(...a.position).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.visibility = v.z < 1 ? 'visible' : 'hidden';
    }
  });
  return null;
}
