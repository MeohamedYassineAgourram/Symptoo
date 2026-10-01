import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Mesh } from 'three';
import { clay, water, PALETTE } from '../materials';

/** Procedural zellige tile pattern (8-point stars on a blue/green/white grid). */
function makeZelligeTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(0, 0, size, size);
  const star = (cx: number, cy: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = i % 2 ? r * 0.55 : r;
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = '#7fb8b0';
  for (const [x, y] of [[0, 0], [size, 0], [0, size], [size, size]] as const) star(x, y, 30, '#3f8f8a');
  star(size / 2, size / 2, 30, '#2f6f9a');
  star(size / 2, size / 2, 13, '#f4efe4');
  ctx.strokeStyle = 'rgba(60,80,90,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Riad-style courtyard floor with a zellige centre and a fountain (README §3.2). */
export function Courtyard({ size = 8.5 }: { size?: number }) {
  const zellige = useMemo(() => {
    const tex = makeZelligeTexture();
    tex.repeat.set(size / 1.4, size / 1.4);
    return tex;
  }, [size]);

  return (
    <group>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[size + 1.2, size + 1.2]} />
        <meshStandardMaterial color={PALETTE.wallSand} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={zellige} roughness={0.7} />
      </mesh>
      <Fountain />
    </group>
  );
}

export function Fountain() {
  const waterRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (waterRef.current) waterRef.current.position.y = 0.36 + Math.sin(clock.elapsedTime * 2) * 0.012;
  });
  return (
    <group position={[0, 0.05, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow material={clay(PALETTE.white)}>
        <cylinderGeometry args={[1.15, 1.25, 0.4, 8]} />
      </mesh>
      <mesh ref={waterRef} position={[0, 0.36, 0]} material={water()}>
        <cylinderGeometry args={[1.0, 1.0, 0.08, 8]} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow material={clay('#3f8f8a')}>
        <cylinderGeometry args={[0.12, 0.18, 0.7, 8]} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow material={clay(PALETTE.white)}>
        <cylinderGeometry args={[0.42, 0.22, 0.16, 8]} />
      </mesh>
      <mesh position={[0, 1.12, 0]} material={water()}>
        <sphereGeometry args={[0.16, 10, 8]} />
      </mesh>
    </group>
  );
}
