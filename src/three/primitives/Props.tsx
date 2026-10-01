import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { ExtrudeGeometry, Shape } from 'three';
import { clay, PALETTE } from '../materials';
import { InstancedProp, type PropInstance } from './InstancedProp';
import { unitBox } from './geometries';

export function Bench({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[0.9, 0.08, 0.3]} radius={0.025} smoothness={2} position={[0, 0.25, 0]} castShadow material={clay(PALETTE.wood)} />
      <RoundedBox args={[0.9, 0.24, 0.06]} radius={0.025} smoothness={2} position={[0, 0.42, -0.13]} castShadow material={clay(PALETTE.wood)} />
    </group>
  );
}

export function Cat({ position, rotationY = 0, color = '#e0a35c' }: { position: [number, number, number]; rotationY?: number; color?: string }) {
  return (
    <group position={position} rotation-y={rotationY} scale={0.9}>
      <mesh position={[0, 0.12, 0]} castShadow material={clay(color)}>
        <capsuleGeometry args={[0.08, 0.16, 4, 8]} />
      </mesh>
      <mesh position={[0, 0.2, 0.13]} castShadow material={clay(color)}>
        <sphereGeometry args={[0.08, 10, 8]} />
      </mesh>
      <mesh position={[0, 0.2, -0.16]} rotation-x={-0.9} material={clay(color)}>
        <cylinderGeometry args={[0.015, 0.02, 0.18, 5]} />
      </mesh>
    </group>
  );
}

/** Green pharmacy/medical cross on a pole. */
export function CrossSign({ position, color = '#3fa55b' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} material={clay('#8a96a3')} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 1.2, 6]} />
      </mesh>
      <group position={[0, 1.35, 0]} rotation-y={Math.PI / 4}>
        <RoundedBox args={[0.5, 0.16, 0.08]} radius={0.03} smoothness={2} material={clay(color, { emissive: color, emissiveIntensity: 0.25 })} />
        <RoundedBox args={[0.16, 0.5, 0.08]} radius={0.03} smoothness={2} material={clay(color, { emissive: color, emissiveIntensity: 0.25 })} />
      </group>
    </group>
  );
}

/** Puffy extruded heart for the Cardiologie wing. */
export function HeartEmblem({ position, scale = 1, color = '#e0605a' }: { position: [number, number, number]; scale?: number; color?: string }) {
  const geo = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.15, -0.35, -0.55, -0.1, -0.55, 0.18);
    s.bezierCurveTo(-0.55, 0.45, -0.2, 0.55, 0, 0.3);
    s.bezierCurveTo(0.2, 0.55, 0.55, 0.45, 0.55, 0.18);
    s.bezierCurveTo(0.55, -0.1, 0.15, -0.35, 0, -0.5);
    const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 4, curveSegments: 16 });
    g.center();
    return g;
  }, []);
  return <mesh geometry={geo} material={clay(color)} position={position} scale={scale} castShadow />;
}

/** Lung-shaped topiary pair for the Pneumologie wing. */
export function LungTopiary({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.33, 0.62, 0]} rotation-z={side * 0.18} castShadow material={clay(PALETTE.leaf)}>
          <sphereGeometry args={[0.36, 14, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 0]} castShadow material={clay(PALETTE.leafDeep)}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow material={clay('#c98d5e')}>
        <cylinderGeometry args={[0.32, 0.26, 0.3, 10]} />
      </mesh>
    </group>
  );
}

export function Road({ position, length, rotationY = 0 }: { position: [number, number, number]; length: number; rotationY?: number }) {
  const dashes = useMemo<PropInstance[]>(() => {
    const n = Math.floor(length / 1.2);
    return Array.from({ length: n }, (_, i) => ({ position: [(i - (n - 1) / 2) * 1.2, 0.03, 0], scale: [0.5, 0.01, 0.08] }));
  }, [length]);
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow material={clay(PALETTE.road)}>
        <planeGeometry args={[length, 1.6]} />
      </mesh>
      <InstancedProp geometry={unitBox()} material={clay('#f4f1ea')} items={dashes} castShadow={false} />
    </group>
  );
}
