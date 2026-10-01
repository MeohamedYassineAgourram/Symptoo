import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Mesh } from 'three';

export type HotspotTone = 'idle' | 'active' | 'found' | 'missed';

const COLORS: Record<HotspotTone, string> = {
  idle: '#3fb8a5',
  active: '#e2a93b',
  found: '#5db37e',
  missed: '#ff7a1a',
};

interface HotspotProps {
  position: [number, number, number];
  tone: HotspotTone;
  label: string;
  onPick?: () => void;
}

/** Glowing, pulsing body-zone marker with a generous invisible hit area (README §4.3). */
export function Hotspot({ position, tone, label, onPick }: HotspotProps) {
  const glow = useRef<Mesh>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    if (!glow.current) return;
    const base = tone === 'found' || tone === 'missed' ? 1.9 : 1;
    const s = base * (1 + Math.sin(clock.elapsedTime * 3 + position[0] * 4) * 0.18) + (hover ? 0.25 : 0);
    glow.current.scale.setScalar(s);
  });
  const color = COLORS[tone];
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8 || !onPick) return;
    e.stopPropagation();
    onPick();
  };
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[0.075, 14, 12]} />
        <meshBasicMaterial color={color} transparent opacity={tone === 'idle' ? 0.35 : tone === 'active' ? 0.55 : 0.8} depthWrite={false} />
      </mesh>
      <mesh
        name={label}
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = '';
        }}
      >
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
