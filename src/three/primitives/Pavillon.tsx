import { useEffect, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { clay, PALETTE } from '../materials';
import { roofGeometry } from './geometries';
import type { PropInstance } from './InstancedProp';

export interface PavillonSpec {
  id: string;
  position: [number, number, number];
  width: number;
  depth: number;
  floors: number;
  wall: string;
  accent: string;
}

export const FLOOR_H = 1.05;
export const pavillonHeight = (floors: number) => floors * FLOOR_H + 0.35;

interface PavillonProps extends PavillonSpec {
  onSelect?: (id: string) => void;
  selected?: boolean;
  /** Under construction: greyed out (scaffolding is drawn by the scene). */
  locked?: boolean;
  /** Just unlocked: the building "pops" into colour. */
  celebrate?: boolean;
  /** 100 % mastery: golden flag on the roof. */
  gold?: boolean;
}

const LOCKED = { wall: '#cdd0d2', roof: '#a3abb0', roofDeep: '#8b9398', accent: '#9aa3a8' };

/** A hospital wing built from rounded primitives: walls, green-tiled hip roof, accent sign. */
export function Pavillon({
  id,
  position,
  width,
  depth,
  floors,
  wall,
  accent,
  onSelect,
  selected,
  locked,
  celebrate,
  gold,
}: PavillonProps) {
  const [hover, setHover] = useState(false);
  const h = pavillonHeight(floors);
  const body = useRef<Group>(null);
  const popStart = useRef<number | null>(null);
  useEffect(() => {
    if (celebrate) popStart.current = -1;
  }, [celebrate]);
  // Spring "pop" when a wing is unlocked: squashed, overshoots, settles.
  useFrame(({ clock }) => {
    const g = body.current;
    if (!g || popStart.current === null) return;
    if (popStart.current < 0) popStart.current = clock.elapsedTime;
    const t = clock.elapsedTime - popStart.current;
    const s = 1 - Math.exp(-4.5 * t) * Math.cos(9 * t) * 0.75;
    g.scale.set(1 + (1 - s) * 0.3, s, 1 + (1 - s) * 0.3);
    if (t > 2.5) {
      g.scale.set(1, 1, 1);
      popStart.current = null;
    }
  });
  const c = locked
    ? { wall: LOCKED.wall, roof: LOCKED.roof, roofDeep: LOCKED.roofDeep, accent: LOCKED.accent }
    : { wall, roof: PALETTE.roofGreen, roofDeep: PALETTE.roofGreenDeep, accent };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Ignore taps that were really drags (camera panning).
    if (e.delta > 8 || !onSelect) return;
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <group
      position={position}
      onClick={onSelect ? handleClick : undefined}
      onPointerOver={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (!onSelect) return;
        setHover(false);
        document.body.style.cursor = '';
      }}
    >
      <group ref={body}>
        <RoundedBox
          args={[width, h, depth]}
          radius={0.14}
          smoothness={3}
          position={[0, h / 2, 0]}
          castShadow
          receiveShadow
          material={clay(c.wall)}
        />
        {/* Plinth band */}
        <RoundedBox
          args={[width + 0.08, 0.22, depth + 0.08]}
          radius={0.06}
          smoothness={2}
          position={[0, 0.11, 0]}
          receiveShadow
          material={clay(PALETTE.wallSand)}
        />
        {/* Roof trim and green glazed-tile roof */}
        <RoundedBox
          args={[width + 0.36, 0.16, depth + 0.36]}
          radius={0.06}
          smoothness={2}
          position={[0, h + 0.08, 0]}
          castShadow
          material={clay(c.roofDeep)}
        />
        <mesh
          geometry={roofGeometry()}
          material={clay(c.roof)}
          position={[0, h + 0.16, 0]}
          scale={[width + 0.2, Math.min(width, depth) * 0.75, depth + 0.2]}
          castShadow
        />
        {/* Accent sign on the front (+z) face */}
        <RoundedBox
          args={[width * 0.62, 0.36, 0.1]}
          radius={0.04}
          smoothness={2}
          position={[0, h - 0.32, depth / 2 + 0.05]}
          material={clay(c.accent)}
        />
        {gold && (
          <group position={[0, h + 0.16 + Math.min(width, depth) * 0.41, 0]}>
            <mesh position={[0, 0.45, 0]} material={clay('#8a96a3')}>
              <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
            </mesh>
            <mesh
              position={[0.22, 0.75, 0]}
              rotation-z={-Math.PI / 2}
              scale={[1, 1, 0.15]}
              material={clay('#e2a93b', { emissive: '#e2a93b', emissiveIntensity: 0.35 })}
            >
              <coneGeometry args={[0.18, 0.42, 3]} />
            </mesh>
          </group>
        )}
      </group>
      {gold && (
        <mesh position={[0, 0.025, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[Math.max(width, depth) * 0.66, Math.max(width, depth) * 0.74, 40]} />
          <meshBasicMaterial color="#e2a93b" transparent opacity={0.6} />
        </mesh>
      )}
      {(hover || selected) && (
        <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[Math.max(width, depth) * 0.72, Math.max(width, depth) * 0.82, 40]} />
          <meshBasicMaterial color={accent} transparent opacity={0.55} />
        </mesh>
      )}
    </group>
  );
}

/** Arched openings for the two camera-facing sides (+z and +x), gathered into shared instanced meshes. */
export function pavillonOpenings(spec: PavillonSpec): { arches: PropInstance[]; windows: PropInstance[] } {
  const {
    position: [px, py, pz],
    width,
    depth,
    floors,
  } = spec;
  const arches: PropInstance[] = [];
  const windows: PropInstance[] = [];
  const faces = [
    { len: width, along: (o: number) => [px + o, pz + depth / 2] as const, rot: 0 },
    { len: depth, along: (o: number) => [px + width / 2, pz - o] as const, rot: Math.PI / 2 },
  ];
  for (const face of faces) {
    const n = Math.max(2, Math.round(face.len / 1.1));
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * (face.len / n);
      const [x, z] = face.along(o);
      arches.push({ position: [x, py + 0.22, z], rotationY: face.rot, scale: [1.25, 0.72, 1] });
      for (let f = 1; f < floors; f++) {
        windows.push({
          position: [x, py + f * FLOOR_H + 0.25, z],
          rotationY: face.rot,
          scale: [0.7, 0.5, 1],
        });
      }
    }
  }
  return { arches, windows };
}
