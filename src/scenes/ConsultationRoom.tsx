import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Diorama } from '../three/Diorama';
import { clay, PALETTE } from '../three/materials';
import { InstancedProp, type PropInstance } from '../three/primitives/InstancedProp';
import { archGeometry } from '../three/primitives/geometries';
import { HeartEmblem, LungTopiary } from '../three/primitives/Props';
import { ModelInstances } from '../three/models/Model';
import { PATIENT_ANCHORS, PatientBuilder } from '../three/PatientBuilder';
import { Doctor } from '../three/Doctor';
import { Hotspot, type HotspotTone } from '../three/Hotspot';
import { useSceneStore } from '../stores/sceneStore';
import { tDynamic } from '../i18n/t';

export const ROOM_W = 10;
export const ROOM_D = 9;
const WALL_H = 2.8;
/** The patient lies on the examination table here (world). */
export const PATIENT_ORIGIN: [number, number, number] = [0.3, 0.86, -0.4];
export const PATIENT_FOCUS: [number, number, number] = [0.3, 1.1, -0.4];

export const anchorWorld = (root: string): [number, number, number] => {
  const a = PATIENT_ANCHORS[root] ?? PATIENT_ANCHORS.general!;
  return [PATIENT_ORIGIN[0] + a[0], PATIENT_ORIGIN[1] + a[1], PATIENT_ORIGIN[2] + a[2]];
};

/** Small isometric consultation room diorama (README §4.3). Renders store state; emits zone taps. */
export function ConsultationRoom({ density, reducedMotion }: { density: number; reducedMotion: boolean }) {
  const consult = useSceneStore((s) => s.consult);
  const pickZone = useSceneStore((s) => s.pickZone);
  const hw = ROOM_W / 2;
  const hd = ROOM_D / 2;

  const windows = useMemo<PropInstance[]>(
    () => [
      { position: [1.6, 0.9, -hd + 0.42], scale: [2.4, 1.5, 1] },
      { position: [3.4, 0.9, -hd + 0.42], scale: [2.4, 1.5, 1] },
    ],
    [hd],
  );
  const plants = useMemo<PropInstance[]>(() => [{ position: [hw - 0.9, 0, -hd + 0.9], scale: 0.75 }], [hw, hd]);

  const doctorAction = useMemo(
    () => (consult?.action ? { tool: consult.action.tool, target: anchorWorld(consult.action.root), seq: consult.action.seq } : null),
    [consult?.action],
  );

  const toneFor = (root: string): HotspotTone => {
    const h = consult?.highlights?.[root];
    if (h) return h;
    return consult?.activeRoot === root ? 'active' : 'idle';
  };
  const visibleRoots = consult?.highlights
    ? Object.keys(consult.highlights)
    : consult?.hotspots
      ? Object.keys(PATIENT_ANCHORS)
      : [];

  return (
    <Diorama width={ROOM_W} depth={ROOM_D} top="#f2ede3">
      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0.25, 0.02, 0.25]} receiveShadow material={clay('#e7ddd0')}>
        <planeGeometry args={[ROOM_W - 1.1, ROOM_D - 1.1]} />
      </mesh>
      {/* Walls with a zellige band */}
      <RoundedBox args={[ROOM_W, WALL_H, 0.45]} radius={0.1} smoothness={2} position={[0, WALL_H / 2, -hd + 0.22]} castShadow receiveShadow material={clay(PALETTE.wallWhite)} />
      <RoundedBox args={[0.45, WALL_H, ROOM_D]} radius={0.1} smoothness={2} position={[-hw + 0.22, WALL_H / 2, 0]} castShadow receiveShadow material={clay(PALETTE.wallSand)} />
      <mesh position={[0.22, 0.3, -hd + 0.46]} material={clay('#3f8f8a')}>
        <boxGeometry args={[ROOM_W - 0.45, 0.6, 0.02]} />
      </mesh>
      <InstancedProp geometry={archGeometry()} material={clay('#9fcbe6', { roughness: 0.3 })} items={windows} castShadow={false} />

      {/* Posters: heart and lungs anatomy */}
      <group position={[-1.6, 1.75, -hd + 0.47]}>
        <mesh material={clay('#fbf7ef')}>
          <boxGeometry args={[0.9, 1.1, 0.03]} />
        </mesh>
        <HeartEmblem position={[0, 0.05, 0.05]} scale={0.55} />
      </group>
      <group position={[-hw + 0.47, 1.75, -1.4]} rotation-y={Math.PI / 2}>
        <mesh material={clay('#fbf7ef')}>
          <boxGeometry args={[0.9, 1.1, 0.03]} />
        </mesh>
        <group position={[0, -0.45, 0.05]} rotation-x={Math.PI / 2} scale={0.7}>
          <LungTopiary position={[0, 0, 0]} />
        </group>
      </group>

      {/* Desk with computer, lamp and stethoscope */}
      <group position={[-3.2, 0, -3.1]}>
        <RoundedBox args={[2.2, 0.08, 1]} radius={0.03} smoothness={2} position={[0, 0.78, 0]} castShadow material={clay(PALETTE.wood)} />
        {[-0.95, 0.95].map((x) => (
          <mesh key={x} position={[x, 0.39, 0]} material={clay('#8a6040')} castShadow>
            <boxGeometry args={[0.1, 0.78, 0.9]} />
          </mesh>
        ))}
        <RoundedBox args={[0.7, 0.45, 0.06]} radius={0.03} smoothness={2} position={[0.2, 1.1, -0.25]} castShadow material={clay('#3c4550')} />
        <mesh position={[0.2, 1.1, -0.21]} material={clay('#7fc4e8', { emissive: '#5fb0dd', emissiveIntensity: 0.5 })}>
          <boxGeometry args={[0.62, 0.37, 0.01]} />
        </mesh>
        <mesh position={[0.2, 0.86, -0.25]} material={clay('#3c4550')}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
        </mesh>
        <mesh position={[0.2, 0.83, 0.15]} material={clay('#e9e4da')}>
          <boxGeometry args={[0.55, 0.02, 0.18]} />
        </mesh>
        <group position={[-0.75, 0.82, -0.2]}>
          <mesh position={[0, 0.2, 0]} material={clay('#8a96a3')}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          </mesh>
          <mesh position={[0.08, 0.42, 0]} rotation-z={-0.8} material={clay('#e2a93b', { emissive: '#ffd36b', emissiveIntensity: 0.4 })}>
            <coneGeometry args={[0.1, 0.16, 12, 1, true]} />
          </mesh>
        </group>
        <mesh position={[-0.35, 0.83, 0.2]} rotation-x={Math.PI / 2} material={clay('#3a7ca5')}>
          <torusGeometry args={[0.12, 0.015, 8, 20]} />
        </mesh>
      </group>

      {/* Examination table */}
      <group position={[PATIENT_ORIGIN[0], 0, PATIENT_ORIGIN[2]]}>
        <RoundedBox args={[2.5, 0.55, 0.8]} radius={0.08} smoothness={2} position={[0, 0.3, 0]} castShadow receiveShadow material={clay('#f4f1ea')} />
        <RoundedBox args={[2.7, 0.18, 0.95]} radius={0.08} smoothness={2} position={[0, 0.72, 0]} castShadow receiveShadow material={clay('#8fcbbf')} />
        <mesh position={[0.1, 0.815, 0]} rotation-x={-Math.PI / 2} material={clay('#ffffff')}>
          <planeGeometry args={[2.4, 0.55]} />
        </mesh>
        <RoundedBox args={[0.42, 0.08, 0.62]} radius={0.04} smoothness={2} position={[-1.05, 0.85, 0]} material={clay('#ffffff')} />
      </group>
      <group position={[2.4, 0, 1.6]}>
        <mesh position={[0, 0.25, 0]} material={clay('#8a96a3')} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.5, 8]} />
        </mesh>
        <RoundedBox args={[0.5, 0.08, 0.5]} radius={0.03} smoothness={2} position={[0, 0.52, 0]} material={clay('#3a7ca5')} castShadow />
      </group>
      {density > 0.5 && <ModelInstances id="nature.bush" items={plants} />}

      {consult && (
        <>
          <PatientBuilder key={consult.caseId} look={consult.look} position={[PATIENT_ORIGIN[0], PATIENT_ORIGIN[1] - 0.04, PATIENT_ORIGIN[2]]} />
          <Doctor home={[PATIENT_ORIGIN[0] - 0.3, 0, PATIENT_ORIGIN[2] - 0.95]} action={doctorAction} reducedMotion={reducedMotion} />
          {visibleRoots.map((root) => (
            <Hotspot
              key={root}
              position={anchorWorld(root)}
              tone={toneFor(root)}
              label={tDynamic(`zones.${root}`)}
              onPick={consult.highlights ? undefined : () => pickZone(root)}
            />
          ))}
        </>
      )}
    </Diorama>
  );
}
