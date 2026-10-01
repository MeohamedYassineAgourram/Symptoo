import { RoundedBox } from '@react-three/drei';
import { clay } from '../materials';
import { wheelsGeometry } from './geometries';

export type VehicleVariant = 'car' | 'petit-taxi' | 'ambulance';

interface VehicleProps {
  variant?: VehicleVariant;
  color?: string;
  position: [number, number, number];
  rotationY?: number;
}

/** Petit taxi colours differ by city; Marrakech taxis are beige. */
const TAXI_BEIGE = '#e9d6a8';

export function Vehicle({ variant = 'car', color = '#8fb3d9', position, rotationY = 0 }: VehicleProps) {
  const isAmb = variant === 'ambulance';
  const body = isAmb ? '#ffffff' : variant === 'petit-taxi' ? TAXI_BEIGE : color;
  const length = isAmb ? 1.35 : 1.1;
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[length, 0.32, 0.62]} radius={0.1} smoothness={2} position={[0, 0.3, 0]} castShadow material={clay(body)} />
      <RoundedBox
        args={isAmb ? [0.95, 0.42, 0.58] : [0.6, 0.3, 0.56]}
        radius={0.1}
        smoothness={2}
        position={isAmb ? [-0.15, 0.62, 0] : [-0.05, 0.56, 0]}
        castShadow
        material={clay(isAmb ? '#ffffff' : '#cfe3f2')}
      />
      <mesh geometry={wheelsGeometry()} material={clay('#3c4550')} scale={[length / 1.1, 1, 1]} />
      {isAmb && (
        <>
          <mesh position={[-0.15, 0.62, 0.3]} material={clay('#e05a4f')}>
            <boxGeometry args={[0.9, 0.08, 0.02]} />
          </mesh>
          <mesh position={[0.15, 0.88, 0]} material={clay('#4f8fe0', { emissive: '#3366ff', emissiveIntensity: 0.6 })}>
            <boxGeometry args={[0.18, 0.08, 0.14]} />
          </mesh>
        </>
      )}
      {variant === 'petit-taxi' && (
        <mesh position={[-0.05, 0.76, 0]} material={clay('#2f3b4c')}>
          <boxGeometry args={[0.22, 0.08, 0.12]} />
        </mesh>
      )}
    </group>
  );
}
