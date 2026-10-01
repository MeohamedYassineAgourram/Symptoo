import { useMemo } from 'react';
import { WING_IDS, WING_THEMES, type WingId } from '../content/wings';
import { Diorama } from '../three/Diorama';
import { clay, PALETTE } from '../three/materials';
import { Courtyard } from '../three/primitives/Courtyard';
import { Crowd, makeWalkers } from '../three/primitives/Crowd';
import { InstancedProp, type PropInstance } from '../three/primitives/InstancedProp';
import { Pavillon, pavillonHeight, pavillonOpenings, type PavillonSpec } from '../three/primitives/Pavillon';
import { LabelProjector, type LabelAnchor } from '../three/labels';
import { Road } from '../three/primitives/Props';
import { archGeometry } from '../three/primitives/geometries';
import { Model, ModelInstances } from '../three/models/Model';

export const HUB_SIZE = 24;

const LAYOUT: Record<WingId, { pos: [number, number]; floors: number; size?: number }> = {
  generale: { pos: [-7.8, 7.6], floors: 2, size: 3.9 },
  cardio: { pos: [7.8, 7.6], floors: 2, size: 3.9 },
  pneumo: { pos: [7.8, 2.4], floors: 2 },
  digestif: { pos: [7.8, -2.8], floors: 2 },
  neuro: { pos: [7.8, -7.8], floors: 3, size: 3.9 },
  nephro: { pos: [2.6, -7.8], floors: 3 },
  endo: { pos: [-2.6, -7.8], floors: 2 },
  locomoteur: { pos: [-7.8, -7.8], floors: 2, size: 3.9 },
  hemato: { pos: [-7.8, -2.8], floors: 2 },
  dermato: { pos: [-7.8, 2.4], floors: 1 },
};

export const HUB_PAVILLONS: PavillonSpec[] = WING_IDS.map((id, i) => {
  const l = LAYOUT[id];
  const size = l.size ?? 3.6;
  return {
    id,
    position: [l.pos[0], 0, l.pos[1]],
    width: size,
    depth: size,
    floors: l.floors,
    wall: i % 2 ? PALETTE.wallSand : PALETTE.wallWhite,
    accent: WING_THEMES[id].accent,
  };
});

export const HUB_LABELS: LabelAnchor[] = HUB_PAVILLONS.map((p) => ({
  id: p.id,
  position: [p.position[0], pavillonHeight(p.floors) + 0.8, p.position[2]],
}));

interface HubSceneProps {
  density: number;
  selected: WingId | null;
  onSelect?: (id: WingId) => void;
}

/** The whole CHU on one diorama: riad courtyard, ten pavillons, entrance road (README §4.1). */
export function HubScene({ density, selected, onSelect }: HubSceneProps) {
  const openings = useMemo(() => {
    const all = HUB_PAVILLONS.map(pavillonOpenings);
    return { arches: all.flatMap((o) => o.arches), windows: all.flatMap((o) => o.windows) };
  }, []);

  const palms = useMemo<PropInstance[]>(
    () =>
      [
        [-4.7, -4.7], [4.7, -4.7], [-4.7, 4.7], [4.7, 4.7],
        [-1.8, 6.6], [1.8, 6.6], [-1.8, 8.8], [1.8, 8.8],
        [-10.6, 0], [10.6, -0.2], [-4.5, -10.6], [4.8, -10.4],
      ].map(([x, z], i) => ({ position: [x!, 0, z!], rotationY: i * 1.3, scale: 0.9 + (i % 3) * 0.12 })),
    [],
  );
  const orangeTrees = useMemo<PropInstance[]>(
    () => [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]].map(([x, z], i) => ({ position: [x!, 0.05, z!], rotationY: i, scale: 0.95 })),
    [],
  );
  const bushes = useMemo<PropInstance[]>(() => {
    const spots: [number, number][] = [
      [-4.4, 0], [4.4, 0], [0, -4.4], [-10.6, 5], [10.6, 5], [-10.6, -5.3], [10.6, -5.3],
      [-5.2, 10.2], [5.4, 9.4], [0, -10.6], [-2.6, 9.6], [2.6, 9.6],
    ];
    return spots.slice(0, Math.max(4, Math.round(spots.length * density))).map(([x, z], i) => ({
      position: [x, 0, z],
      scale: 0.55 + (i % 3) * 0.12,
      color: i % 2 ? PALETTE.leaf : '#82b874',
    }));
  }, [density]);

  const walkers = useMemo(() => {
    const loop: [number, number, number][] = [[-3.6, 0.05, -3.6], [3.6, 0.05, -3.6], [3.6, 0.05, 3.6], [-3.6, 0.05, 3.6]];
    const n = Math.round(16 * density);
    return makeWalkers(n, 0, (i) => {
      if (i < n / 2) return { path: loop, speed: 0.35 + (i % 3) * 0.08, phase: i / (n / 2), scale: 0.85 };
      // Static people near the wings and the entrance.
      const anchors: [number, number][] = [[-5.6, 6.2], [5.8, 6.4], [6, 0.6], [-6, -1], [0.8, -5.9], [-0.8, 9.6], [0.9, 9.9], [-5.5, -5.8]];
      const [x, z] = anchors[i % anchors.length]!;
      return { position: [x, 0, z], phase: i * 0.9, scale: 0.85 };
    });
  }, [density]);

  return (
    <Diorama width={HUB_SIZE} depth={HUB_SIZE}>
      <Courtyard size={8.5} />
      {/* Entrance walkway from the road to the courtyard */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 7.5]} receiveShadow material={clay(PALETTE.path)}>
        <planeGeometry args={[2.2, 5.6]} />
      </mesh>
      <Road position={[0, 0, 10.9]} length={HUB_SIZE - 0.6} />
      <LabelProjector anchors={HUB_LABELS} selected={selected} />

      {HUB_PAVILLONS.map((spec) => (
        <Pavillon
          key={spec.id}
          {...spec}
          selected={selected === spec.id}
          onSelect={onSelect ? (id) => onSelect(id as WingId) : undefined}
        />
      ))}
      <InstancedProp geometry={archGeometry()} material={clay(PALETTE.arch)} items={openings.arches} castShadow={false} />
      <InstancedProp geometry={archGeometry()} material={clay(PALETTE.wood)} items={openings.windows} castShadow={false} />

      <ModelInstances id="nature.palm" items={palms} />
      <ModelInstances id="nature.orange-tree" items={orangeTrees} />
      <ModelInstances id="nature.bush" items={bushes} />
      <Crowd walkers={walkers} />

      <Model id="vehicle.ambulance" position={[-5.4, 0, 10.6]} rotationY={0} />
      <Model id="vehicle.petit-taxi" position={[3.2, 0, 11.2]} rotationY={Math.PI} />
      <Model id="vehicle.car" position={[8.6, 0, 11.2]} rotationY={Math.PI} color="#e7a7a0" />
      <Model id="prop.cross-sign" position={[-3.2, 0, 9.0]} />
      <Model id="prop.bench" position={[-3.9, 0.05, 0]} rotationY={Math.PI / 2} />
      <Model id="prop.bench" position={[3.9, 0.05, 0]} rotationY={-Math.PI / 2} />
      <Model id="prop.cat" position={[1.4, 0.05, 3.6]} rotationY={0.8} />
    </Diorama>
  );
}
