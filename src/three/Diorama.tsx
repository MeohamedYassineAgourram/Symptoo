import type { ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { clay, PALETTE } from './materials';

interface DioramaProps {
  width: number;
  depth: number;
  thickness?: number;
  top?: string;
  earth?: string;
  children?: ReactNode;
}

/**
 * Thick rounded base slab with a visible earth layer (README §3.1).
 * The walkable top surface sits at y = 0. A shadow-only ground plane catches the long soft shadow.
 */
export function Diorama({
  width,
  depth,
  thickness = 1.6,
  top = PALETTE.slabTop,
  earth = PALETTE.slabEarth,
  children,
}: DioramaProps) {
  const topH = 0.4;
  const deepH = 0.35;
  return (
    <group>
      <RoundedBox args={[width, topH, depth]} radius={0.18} smoothness={3} position={[0, -topH / 2, 0]} receiveShadow castShadow material={clay(top)} />
      <RoundedBox
        args={[width - 0.12, thickness, depth - 0.12]}
        radius={0.2}
        smoothness={3}
        position={[0, -topH - thickness / 2 + 0.1, 0]}
        castShadow
        material={clay(earth)}
      />
      <RoundedBox
        args={[width - 0.24, deepH, depth - 0.24]}
        radius={0.15}
        smoothness={2}
        position={[0, -topH - thickness - deepH / 2 + 0.2, 0]}
        material={clay(PALETTE.slabEarthDeep)}
      />
      <mesh rotation-x={-Math.PI / 2} position={[0, -topH - thickness - deepH + 0.15, 0]} receiveShadow>
        <planeGeometry args={[width * 6, depth * 6]} />
        <shadowMaterial transparent opacity={0.16} color="#2b3a4a" />
      </mesh>
      {children}
    </group>
  );
}
