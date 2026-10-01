import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Vector3, type Group, type MeshStandardMaterial } from 'three';
import { Diorama } from '../three/Diorama';
import { clay, PALETTE } from '../three/materials';
import { Crowd, makeWalkers } from '../three/primitives/Crowd';
import { InstancedProp, type PropInstance } from '../three/primitives/InstancedProp';
import { Person, type PersonLook } from '../three/primitives/Person';
import { archGeometry, unitBox } from '../three/primitives/geometries';
import { ModelInstances } from '../three/models/Model';
import { useSceneStore } from '../stores/sceneStore';
import progression from '../config/progression.json';

export const ROOM_SIZE = 12;
const WALL_H = 3;

/** Queue slots from the entrance (back of the line) to the consultation door. */
const QUEUE: [number, number, number][] = [
  [1.6, 0, -3.3],
  [1.9, 0, -2.2],
  [2.3, 0, -1.1],
  [2.8, 0, 0],
  [3.3, 0, 1.1],
  [3.8, 0, 2.2],
  [4.3, 0, 3.3],
];
const LOOKS: PersonLook[] = [
  { outfit: '#d9b26a', skin: '#d4a072', hair: '#2b2118' },
  { outfit: '#8fb3d9', skin: '#e6b98f', hair: '#c86b5a', hijab: true },
  { outfit: '#9cc98a', skin: '#b07a4f', hair: '#1d1a17' },
  { outfit: '#e7a7a0', skin: '#f3d2b5', hair: '#5f86b0', hijab: true },
  { outfit: '#b39ddb', skin: '#8a5a36', hair: '#4a3121' },
  { outfit: '#c9a27a', skin: '#e6b98f', hair: '#6b4a2e' },
  { outfit: '#7fb8b0', skin: '#d4a072', hair: '#e3c46c', hijab: true },
];

/** Patients advance one slot each time the player answers; the first goes through the door. */
function PatientQueue() {
  const served = useSceneStore((s) => s.served);
  const refs = useRef<(Group | null)[]>([]);
  const goal = useMemo(() => new Vector3(), []);
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 6);
    const n = LOOKS.length;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const slot = (((i - served) % n) + n) % n;
      goal.set(...QUEUE[slot]!);
      // The patient who just went through the door reappears at the back of the line.
      if (g.position.distanceTo(goal) > 3) g.position.copy(goal);
      else g.position.lerp(goal, k);
      g.position.y = Math.abs(Math.sin((g.position.x + g.position.z) * 6)) * 0.03;
    });
  });
  return (
    <>
      {LOOKS.map((look, i) => (
        <Person key={i} ref={(g) => void (refs.current[i] = g)} {...look} rotationY={Math.PI + 0.4} scale={1.15} />
      ))}
    </>
  );
}

/** Emergency light above the door that pulses when the combo is high. */
function ComboLight() {
  const mat = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const hot = useSceneStore.getState().combo >= progression.gardeRapide.highComboThreshold;
    if (mat.current) mat.current.emissiveIntensity = hot ? 0.6 + Math.sin(clock.elapsedTime * 10) * 0.5 : 0.1;
  });
  return (
    <mesh position={[1.2, WALL_H - 0.2, -ROOM_SIZE / 2 + 0.55]}>
      <boxGeometry args={[0.7, 0.22, 0.12]} />
      <meshStandardMaterial ref={mat} color="#e05a4f" emissive="#ff3b2f" emissiveIntensity={0.1} roughness={0.6} />
    </mesh>
  );
}

/** Waiting-room diorama behind the Garde rapide UI (README §5.2). */
export function GardeBackdrop({ accent, density }: { accent: string; density: number }) {
  const half = ROOM_SIZE / 2;
  const windows = useMemo<PropInstance[]>(
    () => [
      { position: [-3.2, 1.0, -half + 0.42], scale: [2, 1.6, 1] },
      { position: [-1.0, 1.0, -half + 0.42], scale: [2, 1.6, 1] },
      { position: [-half + 0.42, 1.0, -2.5], rotationY: Math.PI / 2, scale: [2, 1.6, 1] },
      { position: [-half + 0.42, 1.0, 0.5], rotationY: Math.PI / 2, scale: [2, 1.6, 1] },
      { position: [-half + 0.42, 1.0, 3.5], rotationY: Math.PI / 2, scale: [2, 1.6, 1] },
    ],
    [half],
  );
  const chairs = useMemo<PropInstance[]>(
    () => Array.from({ length: 6 }, (_, i) => ({ position: [-half + 1.1, 0.25, -2.6 + i * 1.1], scale: [0.7, 0.5, 0.75], color: i % 2 ? '#7fb8b0' : '#8fb3d9' })),
    [half],
  );
  const seated = useMemo(
    () =>
      makeWalkers(Math.round(4 * density), 11, (i) => ({
        position: [-half + 1.15, 0.25, -2.6 + i * 2.2],
        phase: Math.PI / 2,
        scale: 1.05,
      })),
    [density, half],
  );
  const plants = useMemo<PropInstance[]>(() => [{ position: [-half + 1, 0, half - 1.2], scale: 0.7 }, { position: [half - 1.2, 0, -half + 1.2], scale: 0.8 }], [half]);

  return (
    <Diorama width={ROOM_SIZE} depth={ROOM_SIZE} top="#f2ede3">
      {/* Floor tiles */}
      <mesh rotation-x={-Math.PI / 2} position={[0.4, 0.02, 0.4]} receiveShadow material={clay('#e9e1d2')}>
        <planeGeometry args={[ROOM_SIZE - 1.6, ROOM_SIZE - 1.6]} />
      </mesh>
      {/* Back and left walls */}
      <RoundedBox args={[ROOM_SIZE, WALL_H, 0.5]} radius={0.12} smoothness={2} position={[0, WALL_H / 2, -half + 0.25]} castShadow receiveShadow material={clay(PALETTE.wallWhite)} />
      <RoundedBox args={[0.5, WALL_H, ROOM_SIZE]} radius={0.12} smoothness={2} position={[-half + 0.25, WALL_H / 2, 0]} castShadow receiveShadow material={clay(PALETTE.wallSand)} />
      {/* Zellige dado band */}
      <mesh position={[0.25, 0.35, -half + 0.51]} material={clay('#3f8f8a')}>
        <boxGeometry args={[ROOM_SIZE - 0.5, 0.7, 0.02]} />
      </mesh>
      <InstancedProp geometry={archGeometry()} material={clay('#9fcbe6', { roughness: 0.3 })} items={windows} castShadow={false} />
      {/* Consultation door */}
      <mesh position={[1.2, 0, -half + 0.48]} scale={[2.6, 2.3, 1]} geometry={archGeometry()} material={clay(accent)} />
      <ComboLight />
      {/* Reception desk */}
      <group position={[-2.6, 0, -3.4]}>
        <RoundedBox args={[2.6, 0.9, 0.8]} radius={0.12} smoothness={2} position={[0, 0.45, 0]} castShadow material={clay(PALETTE.wood)} />
        <RoundedBox args={[2.7, 0.08, 0.95]} radius={0.03} smoothness={2} position={[0, 0.94, 0]} material={clay(PALETTE.wallWhite)} />
        <Person outfit="#ffffff" skin="#e6b98f" hair="#e9e4da" hijab position={[0.3, 0.3, -0.9]} rotationY={0.2} scale={1.05} />
      </group>
      <InstancedProp geometry={unitBox()} material={clay('#ffffff')} items={chairs} />
      <Crowd walkers={seated} />
      <ModelInstances id="nature.bush" items={plants} />
      <PatientQueue />
      {/* The player-doctor waiting at the door */}
      <Person outfit="#ffffff" skin="#d4a072" hair="#2b2118" position={[-0.2, 0, -4.1]} rotationY={0.7} scale={1.2} />
    </Diorama>
  );
}
