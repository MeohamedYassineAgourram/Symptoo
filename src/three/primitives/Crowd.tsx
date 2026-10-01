import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Matrix4, type InstancedMesh } from 'three';
import { clay } from '../materials';
import { bodyGeometry, hairGeometry, headGeometry, hijabGeometry } from './geometries';

export interface Walker {
  /** Fixed position, or a loop path the walker follows. */
  position?: [number, number, number];
  path?: [number, number, number][];
  speed?: number;
  phase?: number;
  outfit: string;
  skin: string;
  hair: string;
  hijab?: boolean;
  scale?: number;
}

const SKINS = ['#f3d2b5', '#e6b98f', '#d4a072', '#b07a4f', '#8a5a36', '#6a4128'];
const HAIR = ['#2b2118', '#4a3121', '#1d1a17', '#6b4a2e'];
const OUTFITS = ['#ffffff', '#ffffff', '#8fb3d9', '#e7a7a0', '#9cc98a', '#d9b26a', '#b39ddb', '#7fb8b0'];
const HIJABS = ['#c86b5a', '#5f86b0', '#e3c46c', '#8a6fb0', '#e9e4da'];

/** Deterministic varied people (white coats included) for scene decoration. */
export function makeWalkers(count: number, seedOffset: number, place: (i: number) => Omit<Walker, 'outfit' | 'skin' | 'hair'>): Walker[] {
  return Array.from({ length: count }, (_, i) => {
    const k = i + seedOffset;
    const hijab = k % 4 === 1;
    return {
      ...place(i),
      outfit: OUTFITS[k % OUTFITS.length]!,
      skin: SKINS[(k * 7) % SKINS.length]!,
      hair: hijab ? HIJABS[k % HIJABS.length]! : HAIR[k % HAIR.length]!,
      hijab,
    };
  });
}

const tmp = new Matrix4();
const rot = new Matrix4();
const scl = new Matrix4();

function walkerPose(w: Walker, t: number): { x: number; y: number; z: number; angle: number } {
  if (!w.path || w.path.length < 2) {
    const [x, y, z] = w.position ?? [0, 0, 0];
    return { x, y, z, angle: w.phase ?? 0 };
  }
  // Total loop length, then interpolate along segments.
  const pts = w.path;
  const segs = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length]!;
    return { p, q, len: Math.hypot(q[0] - p[0], q[2] - p[2]) };
  });
  const total = segs.reduce((a, s) => a + s.len, 0);
  let d = (((w.speed ?? 0.5) * t + (w.phase ?? 0) * total) % total + total) % total;
  for (const s of segs) {
    if (d <= s.len) {
      const f = s.len ? d / s.len : 0;
      const bob = Math.abs(Math.sin(t * 9 + (w.phase ?? 0) * 10)) * 0.04;
      return {
        x: s.p[0] + (s.q[0] - s.p[0]) * f,
        y: s.p[1] + bob,
        z: s.p[2] + (s.q[2] - s.p[2]) * f,
        angle: Math.atan2(s.q[0] - s.p[0], s.q[2] - s.p[2]),
      };
    }
    d -= s.len;
  }
  const [x, y, z] = pts[0]!;
  return { x, y, z, angle: 0 };
}

/**
 * Chibi people rendered as 4 instanced meshes (body, head, hair, hijab) whatever the head count.
 * Walkers with a path are animated each frame.
 */
export function Crowd({ walkers }: { walkers: Walker[] }) {
  const body = useRef<InstancedMesh>(null);
  const head = useRef<InstancedMesh>(null);
  const hair = useRef<InstancedMesh>(null);
  const hijab = useRef<InstancedMesh>(null);
  const hairIdx = useMemo(() => walkers.map((w, i) => (w.hijab ? -1 : i)).filter((i) => i >= 0), [walkers]);
  const hijabIdx = useMemo(() => walkers.map((w, i) => (w.hijab ? i : -1)).filter((i) => i >= 0), [walkers]);
  const animated = walkers.some((w) => w.path);

  const write = (t: number) => {
    walkers.forEach((w, i) => {
      const { x, y, z, angle } = walkerPose(w, t);
      const s = w.scale ?? 1;
      tmp.makeTranslation(x, y, z).multiply(rot.makeRotationY(angle)).multiply(scl.makeScale(s, s, s));
      body.current?.setMatrixAt(i, tmp);
      head.current?.setMatrixAt(i, tmp);
      const hi = hairIdx.indexOf(i);
      if (hi >= 0) hair.current?.setMatrixAt(hi, tmp);
      const ji = hijabIdx.indexOf(i);
      if (ji >= 0) hijab.current?.setMatrixAt(ji, tmp);
    });
    for (const m of [body, head, hair, hijab]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const c = new Color();
    walkers.forEach((w, i) => {
      body.current?.setColorAt(i, c.set(w.outfit));
      head.current?.setColorAt(i, c.set(w.skin));
    });
    hairIdx.forEach((wi, i) => hair.current?.setColorAt(i, c.set(walkers[wi]!.hair)));
    hijabIdx.forEach((wi, i) => hijab.current?.setColorAt(i, c.set(walkers[wi]!.hair)));
    for (const m of [body, head, hair, hijab]) {
      if (m.current?.instanceColor) m.current.instanceColor.needsUpdate = true;
    }
    write(0);
    for (const m of [body, head, hair, hijab]) m.current?.computeBoundingSphere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkers, hairIdx, hijabIdx]);

  useFrame(({ clock }) => {
    if (animated) write(clock.elapsedTime);
  });

  if (!walkers.length) return null;
  const m = clay('#ffffff');
  return (
    <group key={walkers.length}>
      <instancedMesh ref={body} args={[bodyGeometry(), m, walkers.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={head} args={[headGeometry(), m, walkers.length]} castShadow frustumCulled={false} />
      {hairIdx.length > 0 && <instancedMesh ref={hair} args={[hairGeometry(), m, hairIdx.length]} frustumCulled={false} />}
      {hijabIdx.length > 0 && <instancedMesh ref={hijab} args={[hijabGeometry(), m, hijabIdx.length]} castShadow frustumCulled={false} />}
    </group>
  );
}
